import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { PassThrough, Readable } from 'stream';
import { FileStorage, StoredFile } from './file-storage';

/**
 * S3-compatible implementation of {@link FileStorage}, targeting MinIO by
 * default but works against AWS S3 / Cloudflare R2 / Backblaze B2 unchanged.
 *
 * Config (env):
 *   S3_ENDPOINT          e.g. http://minio:9000
 *   S3_REGION            default "us-east-1"
 *   S3_BUCKET            target bucket (must exist)
 *   S3_ACCESS_KEY        access key id
 *   S3_SECRET_KEY        secret access key
 *   S3_FORCE_PATH_STYLE  "true" for MinIO (default), "false" for real S3
 */
@Injectable()
export class MinioStorage implements FileStorage {
  private readonly logger = new Logger(MinioStorage.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT ?? 'http://minio:9000';
    const region = process.env.S3_REGION ?? 'us-east-1';
    this.bucket = process.env.S3_BUCKET ?? 'qms-attachments';
    const accessKeyId = process.env.S3_ACCESS_KEY ?? 'minioadmin';
    const secretAccessKey = process.env.S3_SECRET_KEY ?? 'minioadmin';
    const forcePathStyle =
      (process.env.S3_FORCE_PATH_STYLE ?? 'true').toLowerCase() !== 'false';

    this.client = new S3Client({
      endpoint,
      region,
      forcePathStyle,
      credentials: { accessKeyId, secretAccessKey },
    });
    this.logger.log(
      `MinIO/S3 storage ready: endpoint=${endpoint} bucket=${this.bucket}`,
    );
  }

  private extFromFilename(filename: string): string {
    const idx = filename.lastIndexOf('.');
    if (idx < 0 || idx === filename.length - 1) return '';
    const ext = filename.slice(idx).toLowerCase();
    return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : '';
  }

  async save(
    organizationId: string,
    originalFilename: string,
    source: NodeJS.ReadableStream,
    sha256: string,
    size: number,
  ): Promise<StoredFile> {
    const key = `${organizationId}/${randomUUID()}${this.extFromFilename(originalFilename)}`;

    // S3 PutObject supports a Node Readable as Body, but many S3-compat servers
    // require Content-Length up-front — buffer the stream so we can send it
    // with a known length. The attachments service passes a Readable built
    // from a Buffer, so this is cheap.
    const chunks: Buffer[] = [];
    await new Promise<void>((ok, fail) => {
      source.on('data', (c: Buffer | string) =>
        chunks.push(typeof c === 'string' ? Buffer.from(c) : c),
      );
      source.on('error', fail);
      source.on('end', ok);
    });
    const body = Buffer.concat(chunks);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentLength: size,
        ChecksumSHA256: undefined, // we track our own hex sha256 in DB
        Metadata: { sha256 },
      }),
    );

    return { storageKey: key, size, sha256 };
  }

  openRead(storageKey: string): NodeJS.ReadableStream {
    const passthrough = new PassThrough();
    this.client
      .send(
        new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      )
      .then((res) => {
        const body = res.Body as Readable | undefined;
        if (!body) {
          passthrough.destroy(new Error(`File not found: ${storageKey}`));
          return;
        }
        body.on('error', (err) => passthrough.destroy(err));
        body.pipe(passthrough);
      })
      .catch((err) => passthrough.destroy(err as Error));
    return passthrough;
  }

  async remove(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
  }
}
