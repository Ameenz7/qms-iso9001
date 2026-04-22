import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { PassThrough, Readable } from 'stream';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DocumentAttachment } from '../../entities/document-attachment.entity';
import { QmsDocument } from '../../entities/document.entity';
import { AuditService } from '../audit/audit.service';
import { LocalDiskStorage } from '../storage/file-storage';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(DocumentAttachment)
    private readonly attachmentRepo: Repository<DocumentAttachment>,
    @InjectRepository(QmsDocument)
    private readonly docRepo: Repository<QmsDocument>,
    private readonly storage: LocalDiskStorage,
    private readonly audit: AuditService,
  ) {}

  private async getDocOrThrow(
    actor: AuthenticatedUser,
    documentId: string,
  ): Promise<QmsDocument> {
    const doc = await this.docRepo.findOne({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.organizationId !== actor.organizationId) {
      throw new ForbiddenException();
    }
    return doc;
  }

  async list(actor: AuthenticatedUser, documentId: string) {
    await this.getDocOrThrow(actor, documentId);
    return this.attachmentRepo.find({
      where: { documentId },
      order: { createdAt: 'DESC' },
      relations: ['uploadedBy'],
    });
  }

  async upload(
    actor: AuthenticatedUser,
    documentId: string,
    file: Express.Multer.File,
  ): Promise<DocumentAttachment> {
    const doc = await this.getDocOrThrow(actor, documentId);
    if (!file) throw new BadRequestException('No file provided');
    if (!file.buffer || !file.buffer.length) {
      throw new BadRequestException('Empty file');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(
        `File too large (max ${MAX_UPLOAD_BYTES} bytes)`,
      );
    }

    const sha256 = createHash('sha256').update(file.buffer).digest('hex');
    const source = Readable.from(file.buffer);
    const stored = await this.storage.save(
      doc.organizationId,
      file.originalname,
      source,
      sha256,
      file.size,
    );

    const attachment = this.attachmentRepo.create({
      documentId,
      organizationId: doc.organizationId,
      documentVersion: doc.version,
      filename: file.originalname.slice(0, 255),
      mimeType: (file.mimetype || 'application/octet-stream').slice(0, 128),
      size: String(file.size),
      sha256: stored.sha256,
      storageKey: stored.storageKey,
      uploadedById: actor.userId,
    });
    const saved = await this.attachmentRepo.save(attachment);

    await this.audit.log(actor, 'upload', 'DocumentAttachment', saved.id, {
      documentId,
      filename: saved.filename,
      size: saved.size,
      sha256: saved.sha256,
    });

    return saved;
  }

  async getForDownload(actor: AuthenticatedUser, attachmentId: string) {
    const att = await this.attachmentRepo.findOne({
      where: { id: attachmentId },
    });
    if (!att) throw new NotFoundException();
    if (att.organizationId !== actor.organizationId) {
      throw new ForbiddenException();
    }
    const stream = this.storage.openRead(att.storageKey);
    const passthrough = new PassThrough();
    stream.on('error', (err) => passthrough.destroy(err));
    stream.pipe(passthrough);
    return { attachment: att, stream: passthrough };
  }

  async remove(actor: AuthenticatedUser, attachmentId: string) {
    const att = await this.attachmentRepo.findOne({
      where: { id: attachmentId },
    });
    if (!att) throw new NotFoundException();
    if (att.organizationId !== actor.organizationId) {
      throw new ForbiddenException();
    }
    await this.attachmentRepo.remove(att);
    await this.storage.remove(att.storageKey).catch(() => undefined);
    await this.audit.log(actor, 'delete', 'DocumentAttachment', attachmentId, {
      filename: att.filename,
    });
    return { success: true };
  }
}
