import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Capa } from '../../entities/capa.entity';
import { AuditService } from '../audit/audit.service';
import { CreateCapaDto, UpdateCapaDto } from './dto/capa.dto';

@Injectable()
export class CapasService {
  constructor(
    @InjectRepository(Capa) private readonly capaRepo: Repository<Capa>,
    private readonly audit: AuditService,
  ) {}

  async list(actor: AuthenticatedUser) {
    if (!actor.organizationId) {
      throw new BadRequestException('User has no organization');
    }
    return this.capaRepo.find({
      where: { organizationId: actor.organizationId },
      relations: ['createdBy', 'assignedTo', 'nonConformities'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(actor: AuthenticatedUser, id: string) {
    const capa = await this.capaRepo.findOne({
      where: { id },
      relations: ['createdBy', 'assignedTo', 'nonConformities'],
    });
    if (!capa) throw new NotFoundException();
    if (capa.organizationId !== actor.organizationId) {
      throw new ForbiddenException();
    }
    return capa;
  }

  async create(actor: AuthenticatedUser, dto: CreateCapaDto) {
    if (!actor.organizationId) {
      throw new BadRequestException('User has no organization');
    }
    const existing = await this.capaRepo.findOne({
      where: { code: dto.code, organizationId: actor.organizationId },
    });
    if (existing) throw new BadRequestException('CAPA code already exists');

    const capa = this.capaRepo.create({
      code: dto.code,
      title: dto.title,
      description: dto.description,
      rootCause: dto.rootCause ?? null,
      correctiveAction: dto.correctiveAction ?? null,
      preventiveAction: dto.preventiveAction ?? null,
      verification: dto.verification ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      assignedToId: dto.assignedToId ?? null,
      organizationId: actor.organizationId,
      createdById: actor.userId,
    });
    const saved = await this.capaRepo.save(capa);
    await this.audit.log(actor, 'create', 'CAPA', saved.id, {
      code: saved.code,
    });
    return saved;
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateCapaDto) {
    const capa = await this.findOne(actor, id);
    if (dto.title !== undefined) capa.title = dto.title;
    if (dto.description !== undefined) capa.description = dto.description;
    if (dto.rootCause !== undefined) capa.rootCause = dto.rootCause;
    if (dto.correctiveAction !== undefined)
      capa.correctiveAction = dto.correctiveAction;
    if (dto.preventiveAction !== undefined)
      capa.preventiveAction = dto.preventiveAction;
    if (dto.verification !== undefined) capa.verification = dto.verification;
    if (dto.status !== undefined) capa.status = dto.status;
    if (dto.assignedToId !== undefined) capa.assignedToId = dto.assignedToId;
    if (dto.dueDate !== undefined)
      capa.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    const saved = await this.capaRepo.save(capa);
    await this.audit.log(actor, 'update', 'CAPA', id, { ...dto });
    return saved;
  }

  async remove(actor: AuthenticatedUser, id: string) {
    const capa = await this.findOne(actor, id);
    await this.capaRepo.remove(capa);
    await this.audit.log(actor, 'delete', 'CAPA', id);
    return { success: true };
  }
}
