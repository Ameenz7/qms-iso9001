import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { NCStatus } from '../../common/enums/status.enum';
import { Capa } from '../../entities/capa.entity';
import { NonConformity } from '../../entities/non-conformity.entity';
import { RootCause } from '../../entities/root-cause.entity';
import {
  ActionStatus,
  CorrectiveAction,
} from '../../entities/corrective-action.entity';
import { AuditService } from '../audit/audit.service';
import {
  CreateCorrectiveActionDto,
  CreateNonConformityDto,
  CreateRootCauseDto,
  LinkCapaDto,
  UpdateCorrectiveActionDto,
  UpdateNonConformityDto,
  UpdateRootCauseDto,
} from './dto/non-conformity.dto';

@Injectable()
export class NonConformitiesService {
  constructor(
    @InjectRepository(NonConformity)
    private readonly ncRepo: Repository<NonConformity>,
    @InjectRepository(Capa) private readonly capaRepo: Repository<Capa>,
    @InjectRepository(RootCause)
    private readonly rootCauseRepo: Repository<RootCause>,
    @InjectRepository(CorrectiveAction)
    private readonly actionRepo: Repository<CorrectiveAction>,
    private readonly audit: AuditService,
  ) {}

  async list(actor: AuthenticatedUser) {
    if (!actor.organizationId) {
      throw new BadRequestException('User has no organization');
    }
    const qb = this.ncRepo
      .createQueryBuilder('nc')
      .leftJoinAndSelect('nc.submittedBy', 'submittedBy')
      .leftJoinAndSelect('nc.assignedTo', 'assignedTo')
      .leftJoinAndSelect('nc.capa', 'capa')
      .leftJoinAndSelect('nc.rootCauses', 'rootCauses')
      .leftJoinAndSelect('nc.correctiveActions', 'correctiveActions')
      .where('nc.organizationId = :orgId', { orgId: actor.organizationId })
      .orderBy('nc.createdAt', 'DESC');

    if (actor.role === Role.EMPLOYEE) {
      qb.andWhere('nc.submittedById = :uid', { uid: actor.userId });
    }
    return qb.getMany();
  }

  async findOne(actor: AuthenticatedUser, id: string) {
    const nc = await this.ncRepo.findOne({
      where: { id },
      relations: [
        'submittedBy',
        'assignedTo',
        'capa',
        'rootCauses',
        'rootCauses.verifiedBy',
        'rootCauses.actions',
        'correctiveActions',
        'correctiveActions.assignedTo',
        'correctiveActions.rootCause',
      ],
    });
    if (!nc) throw new NotFoundException();
    if (nc.organizationId !== actor.organizationId) {
      throw new ForbiddenException();
    }
    if (actor.role === Role.EMPLOYEE && nc.submittedById !== actor.userId) {
      throw new ForbiddenException();
    }
    return nc;
  }

  async create(actor: AuthenticatedUser, dto: CreateNonConformityDto) {
    if (!actor.organizationId) {
      throw new BadRequestException('User has no organization');
    }
    const nc = this.ncRepo.create({
      ...dto,
      submittedById: actor.userId,
      organizationId: actor.organizationId,
    });
    const saved = await this.ncRepo.save(nc);
    await this.audit.log(actor, 'create', 'NonConformity', saved.id, {
      title: saved.title,
    });
    return saved;
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateNonConformityDto,
  ) {
    const nc = await this.findOne(actor, id);
    if (actor.role === Role.EMPLOYEE) {
      throw new ForbiddenException();
    }
    Object.assign(nc, dto);
    const saved = await this.ncRepo.save(nc);
    await this.audit.log(actor, 'update', 'NonConformity', id, { ...dto });
    return saved;
  }

  async linkToCapa(actor: AuthenticatedUser, id: string, dto: LinkCapaDto) {
    const nc = await this.findOne(actor, id);
    const capa = await this.capaRepo.findOne({ where: { id: dto.capaId } });
    if (!capa) throw new NotFoundException('CAPA not found');
    if (capa.organizationId !== nc.organizationId) {
      throw new ForbiddenException();
    }
    nc.capaId = capa.id;
    nc.status = NCStatus.LINKED;
    const saved = await this.ncRepo.save(nc);
    await this.audit.log(actor, 'link_capa', 'NonConformity', id, {
      capaId: capa.id,
      capaCode: capa.code,
    });
    return saved;
  }

  async remove(actor: AuthenticatedUser, id: string) {
    const nc = await this.findOne(actor, id);
    if (
      actor.role === Role.EMPLOYEE &&
      (nc.submittedById !== actor.userId || nc.status !== NCStatus.SUBMITTED)
    ) {
      throw new ForbiddenException();
    }
    await this.ncRepo.remove(nc);
    await this.audit.log(actor, 'delete', 'NonConformity', id);
    return { success: true };
  }

  // Root Cause management
  async addRootCause(
    actor: AuthenticatedUser,
    ncId: string,
    dto: CreateRootCauseDto,
  ) {
    const nc = await this.findOne(actor, ncId);
    const cause = this.rootCauseRepo.create({
      ...dto,
      ncId: nc.id,
      organizationId: nc.organizationId,
    });
    const saved = await this.rootCauseRepo.save(cause);
    await this.audit.log(actor, 'create', 'RootCause', saved.id, {
      ncId,
      hypothesis: dto.hypothesis,
    });
    return saved;
  }

  async updateRootCause(
    actor: AuthenticatedUser,
    ncId: string,
    causeId: string,
    dto: UpdateRootCauseDto,
  ) {
    await this.findOne(actor, ncId);
    const cause = await this.rootCauseRepo.findOne({
      where: { id: causeId, ncId },
    });
    if (!cause) throw new NotFoundException('Root cause not found');

    if (dto.verificationStatus) {
      cause.verificationStatus = dto.verificationStatus;
      cause.verifiedById = actor.userId;
      cause.verifiedAt = new Date();
    }
    if (dto.hypothesis !== undefined) cause.hypothesis = dto.hypothesis;
    if (dto.likelihood !== undefined) cause.likelihood = dto.likelihood;
    if (dto.isPrimary !== undefined) cause.isPrimary = dto.isPrimary;

    const saved = await this.rootCauseRepo.save(cause);
    await this.audit.log(actor, 'update', 'RootCause', causeId, { ...dto });
    return saved;
  }

  async deleteRootCause(
    actor: AuthenticatedUser,
    ncId: string,
    causeId: string,
  ) {
    await this.findOne(actor, ncId);
    const cause = await this.rootCauseRepo.findOne({
      where: { id: causeId, ncId },
    });
    if (!cause) throw new NotFoundException('Root cause not found');
    await this.rootCauseRepo.remove(cause);
    await this.audit.log(actor, 'delete', 'RootCause', causeId);
    return { success: true };
  }

  // Corrective Action management
  async addAction(
    actor: AuthenticatedUser,
    ncId: string,
    dto: CreateCorrectiveActionDto,
  ) {
    const nc = await this.findOne(actor, ncId);
    const action = this.actionRepo.create({
      ...dto,
      ncId: nc.id,
      organizationId: nc.organizationId,
      createdById: actor.userId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });
    const saved = await this.actionRepo.save(action);
    await this.audit.log(actor, 'create', 'CorrectiveAction', saved.id, {
      ncId,
      description: dto.description,
    });
    return saved;
  }

  async updateAction(
    actor: AuthenticatedUser,
    ncId: string,
    actionId: string,
    dto: UpdateCorrectiveActionDto,
  ) {
    await this.findOne(actor, ncId);
    const action = await this.actionRepo.findOne({
      where: { id: actionId, ncId },
    });
    if (!action) throw new NotFoundException('Action not found');

    if (dto.status === ActionStatus.COMPLETED) {
      action.completionDate = new Date();
    }
    if (dto.dueDate) {
      action.dueDate = new Date(dto.dueDate);
    }
    if (dto.description !== undefined) action.description = dto.description;
    if (dto.status !== undefined) action.status = dto.status;
    if (dto.assignedToId !== undefined) action.assignedToId = dto.assignedToId;
    if (dto.priority !== undefined) action.priority = dto.priority;
    if (dto.effectivenessVerified !== undefined) {
      action.effectivenessVerified = dto.effectivenessVerified;
    }

    const saved = await this.actionRepo.save(action);
    await this.audit.log(actor, 'update', 'CorrectiveAction', actionId, {
      ...dto,
    });
    return saved;
  }

  async deleteAction(actor: AuthenticatedUser, ncId: string, actionId: string) {
    await this.findOne(actor, ncId);
    const action = await this.actionRepo.findOne({
      where: { id: actionId, ncId },
    });
    if (!action) throw new NotFoundException('Action not found');
    await this.actionRepo.remove(action);
    await this.audit.log(actor, 'delete', 'CorrectiveAction', actionId);
    return { success: true };
  }
}
