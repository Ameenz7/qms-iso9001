import { Injectable, Logger } from '@nestjs/common';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { mkdir, stat, unlink } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';

export interface StoredFile {
  storageKey: string;
  size: number;
  sha256: string;
}

export interface FileStorage {
  save(
    organizationId: string,
    originalFilename: string,
    source: NodeJS.ReadableStream,
    contentHashHex: string,
    byteSize: number,
  ): Promise<StoredFile>;

  openRead(storageKey: string): NodeJS.ReadableStream;

  remove(storageKey: string): Promise<void>;
}

/**
 * Local-disk implementation of {@link FileStorage}.
 *
 * Layout: `${UPLOAD_DIR}/${orgId}/${uuid}${ext}`.
 * Designed to be a drop-in replacement for an S3/MinIO-backed impl later —
 * the `storageKey` is opaque to callers.
 */
@Injectable()
export class LocalDiskStorage implements FileStorage {
  private readonly logger = new Logger(LocalDiskStorage.name);
  private readonly baseDir: string;

  constructor() {
    this.baseDir = resolve(process.env.UPLOAD_DIR ?? './uploads');
  }

  private extFromFilename(filename: string): string {
    const idx = filename.lastIndexOf('.');
    if (idx < 0 || idx === filename.length - 1) return '';
    const ext = filename.slice(idx).toLowerCase();
    // Allow only plain alnum extensions, max 8 chars.
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
    const fullPath = join(this.baseDir, key);
    await mkdir(dirname(fullPath), { recursive: true });

    await new Promise<void>((ok, fail) => {
      const w = createWriteStream(fullPath);
      source.on('error', fail);
      w.on('error', fail);
      w.on('finish', ok);
      source.pipe(w);
    });

    return { storageKey: key, size, sha256 };
  }

  openRead(storageKey: string): NodeJS.ReadableStream {
    const fullPath = this.safeResolve(storageKey);
    if (!existsSync(fullPath)) {
      // Return an empty stream that errors so the caller can translate to 404.
      const s = new Readable();
      s._read = () => {
        s.emit('error', new Error(`File not found: ${storageKey}`));
      };
      return s;
    }
    return createReadStream(fullPath);
  }

  async remove(storageKey: string): Promise<void> {
    const fullPath = this.safeResolve(storageKey);
    try {
      await unlink(fullPath);
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e.code !== 'ENOENT') throw err;
    }
  }

  async statSize(storageKey: string): Promise<number> {
    const s = await stat(this.safeResolve(storageKey));
    return s.size;
  }

  /** Ensure the resolved path stays within `baseDir` (no `..` traversal). */
  private safeResolve(storageKey: string): string {
    const full = resolve(this.baseDir, storageKey);
    if (!full.startsWith(this.baseDir + '/') && full !== this.baseDir) {
      throw new Error('Invalid storage key');
    }
    return full;
  }
}

export const FILE_STORAGE = Symbol('FILE_STORAGE');
