import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { QmsDocument } from '../../entities/document.entity';
import { DocumentVersion } from '../../entities/document-version.entity';
import { AuditService } from '../audit/audit.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
} from './dto/document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(QmsDocument)
    private readonly docRepo: Repository<QmsDocument>,
    @InjectRepository(DocumentVersion)
    private readonly versionRepo: Repository<DocumentVersion>,
    private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

  async list(actor: AuthenticatedUser) {
    if (!actor.organizationId) {
      throw new BadRequestException('User has no organization');
    }
    return this.docRepo.find({
      where: { organizationId: actor.organizationId },
      order: { createdAt: 'DESC' },
      relations: ['createdBy'],
    });
  }

  async findOne(actor: AuthenticatedUser, id: string) {
    const doc = await this.docRepo.findOne({
      where: { id },
      relations: ['createdBy', 'versions', 'versions.createdBy'],
    });
    if (!doc) throw new NotFoundException();
    if (doc.organizationId !== actor.organizationId) {
      throw new ForbiddenException();
    }
    doc.versions = (doc.versions ?? []).sort((a, b) => b.version - a.version);
    return doc;
  }

  async create(actor: AuthenticatedUser, dto: CreateDocumentDto) {
    if (!actor.organizationId) {
      throw new BadRequestException('User has no organization');
    }
    const existing = await this.docRepo.findOne({
      where: { code: dto.code, organizationId: actor.organizationId },
    });
    if (existing) throw new BadRequestException('Document code already exists');

    return this.dataSource.transaction(async (trx) => {
      const doc = trx.getRepository(QmsDocument).create({
        code: dto.code,
        title: dto.title,
        content: dto.content,
        version: 1,
        organizationId: actor.organizationId!,
        createdById: actor.userId,
      });
      const saved = await trx.getRepository(QmsDocument).save(doc);
      const version = trx.getRepository(DocumentVersion).create({
        documentId: saved.id,
        version: 1,
        content: dto.content,
        changeNote: 'Initial version',
        createdById: actor.userId,
      });
      await trx.getRepository(DocumentVersion).save(version);

      await this.audit.log(actor, 'create', 'Document', saved.id, {
        code: saved.code,
      });
      return saved;
    });
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateDocumentDto) {
    const doc = await this.findOne(actor, id);
    const contentChanged = dto.content !== undefined && dto.content !== doc.content;

    return this.dataSource.transaction(async (trx) => {
      if (dto.title !== undefined) doc.title = dto.title;
      if (dto.status !== undefined) doc.status = dto.status;
      if (contentChanged) {
        doc.content = dto.content!;
        doc.version = doc.version + 1;
        const version = trx.getRepository(DocumentVersion).create({
          documentId: doc.id,
          version: doc.version,
          content: doc.content,
          changeNote: dto.changeNote ?? null,
          createdById: actor.userId,
        });
        await trx.getRepository(DocumentVersion).save(version);
      }
      const saved = await trx.getRepository(QmsDocument).save(doc);
      await this.audit.log(actor, 'update', 'Document', id, {
        contentChanged,
        status: dto.status,
      });
      return saved;
    });
  }

  async remove(actor: AuthenticatedUser, id: string) {
    const doc = await this.findOne(actor, id);
    await this.docRepo.remove(doc);
    await this.audit.log(actor, 'delete', 'Document', id);
    return { success: true };
  }
}
