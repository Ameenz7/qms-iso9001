import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PassThrough } from 'stream';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DocumentAttachment } from '../../entities/document-attachment.entity';
import { DocumentShare } from '../../entities/document-share.entity';
import { QmsDocument } from '../../entities/document.entity';
import { AuditService } from '../audit/audit.service';
import { FILE_STORAGE, FileStorage } from '../storage/file-storage';
import { CreateShareDto } from './dto/share.dto';

const DEFAULT_TTL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface PublicShareView {
  share: {
    id: string;
    label: string | null;
    expiresAt: Date;
    createdAt: Date;
  };
  organization: { name: string };
  document: {
    id: string;
    code: string;
    title: string;
    content: string;
    version: number;
    status: string;
    updatedAt: Date;
  };
  attachments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: string;
    sha256: string;
    documentVersion: number;
    createdAt: Date;
  }>;
}

@Injectable()
export class SharesService {
  constructor(
    @InjectRepository(DocumentShare)
    private readonly shareRepo: Repository<DocumentShare>,
    @InjectRepository(QmsDocument)
    private readonly docRepo: Repository<QmsDocument>,
    @InjectRepository(DocumentAttachment)
    private readonly attRepo: Repository<DocumentAttachment>,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    private readonly audit: AuditService,
  ) {}

  private generateToken() {
    const plain = crypto.randomBytes(32).toString('base64url');
    const lookup = plain.slice(0, 12);
    const hash = bcrypt.hashSync(plain, 10);
    return { plain, lookup, hash };
  }

  private appUrl(): string {
    return process.env.APP_URL ?? 'http://localhost:4200';
  }

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

  async create(
    actor: AuthenticatedUser,
    documentId: string,
    dto: CreateShareDto,
  ): Promise<{ share: DocumentShare; shareUrl: string }> {
    const doc = await this.getDocOrThrow(actor, documentId);
    const ttlDays = dto.expiresInDays ?? DEFAULT_TTL_DAYS;
    const { plain, lookup, hash } = this.generateToken();
    const expiresAt = new Date(Date.now() + ttlDays * MS_PER_DAY);

    const share = this.shareRepo.create({
      documentId,
      organizationId: doc.organizationId,
      tokenHash: hash,
      tokenLookup: lookup,
      expiresAt,
      label: dto.label ?? null,
      createdById: actor.userId,
    });
    const saved = await this.shareRepo.save(share);

    const shareUrl = `${this.appUrl()}/shared/${encodeURIComponent(plain)}`;

    await this.audit.log(actor, 'create', 'DocumentShare', saved.id, {
      documentId,
      expiresAt: expiresAt.toISOString(),
    });

    return { share: saved, shareUrl };
  }

  async listForDocument(
    actor: AuthenticatedUser,
    documentId: string,
  ): Promise<DocumentShare[]> {
    await this.getDocOrThrow(actor, documentId);
    return this.shareRepo.find({
      where: { documentId },
      order: { createdAt: 'DESC' },
    });
  }

  async revoke(actor: AuthenticatedUser, id: string): Promise<DocumentShare> {
    const share = await this.shareRepo.findOne({ where: { id } });
    if (!share) throw new NotFoundException();
    if (share.organizationId !== actor.organizationId) {
      throw new ForbiddenException();
    }
    if (!share.revokedAt) {
      share.revokedAt = new Date();
      await this.shareRepo.save(share);
      await this.audit.log(actor, 'revoke', 'DocumentShare', id);
    }
    return share;
  }

  private async resolveToken(token: string): Promise<DocumentShare> {
    if (!token || token.length < 12) throw new NotFoundException();
    const lookup = token.slice(0, 12);
    const candidates = await this.shareRepo.find({ where: { tokenLookup: lookup } });
    for (const c of candidates) {
      if (await bcrypt.compare(token, c.tokenHash)) {
        if (c.revokedAt) throw new NotFoundException('Share link revoked');
        if (c.expiresAt.getTime() < Date.now()) {
          throw new NotFoundException('Share link expired');
        }
        return c;
      }
    }
    throw new NotFoundException('Share link not found');
  }

  async resolvePublic(token: string): Promise<PublicShareView> {
    const share = await this.resolveToken(token);
    const doc = await this.docRepo.findOne({
      where: { id: share.documentId },
      relations: ['organization'],
    });
    if (!doc) throw new NotFoundException();
    const attachments = await this.attRepo.find({
      where: { documentId: doc.id },
      order: { createdAt: 'DESC' },
    });
    return {
      share: {
        id: share.id,
        label: share.label,
        expiresAt: share.expiresAt,
        createdAt: share.createdAt,
      },
      organization: { name: doc.organization?.name ?? '' },
      document: {
        id: doc.id,
        code: doc.code,
        title: doc.title,
        content: doc.content,
        version: doc.version,
        status: doc.status,
        updatedAt: doc.updatedAt,
      },
      attachments: attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size,
        sha256: a.sha256,
        documentVersion: a.documentVersion,
        createdAt: a.createdAt,
      })),
    };
  }

  async openPublicAttachment(token: string, attachmentId: string) {
    const share = await this.resolveToken(token);
    const att = await this.attRepo.findOne({ where: { id: attachmentId } });
    if (!att) throw new NotFoundException();
    if (att.documentId !== share.documentId) throw new NotFoundException();
    if (att.organizationId !== share.organizationId) {
      throw new NotFoundException();
    }
    const source = this.storage.openRead(att.storageKey);
    const passthrough = new PassThrough();
    source.on('error', (err) => passthrough.destroy(err));
    source.pipe(passthrough);
    return { attachment: att, stream: passthrough };
  }
}
