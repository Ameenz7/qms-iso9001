import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import {
  CAPAStatus,
  CapaSubtaskStatus,
  NCStatus,
} from '../../common/enums/status.enum';
import { Capa } from '../../entities/capa.entity';
import { CapaSubtask } from '../../entities/capa-subtask.entity';
import { NonConformity } from '../../entities/non-conformity.entity';
import { User } from '../../entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { CreateCapaDto, UpdateCapaDto } from './dto/capa.dto';
import {
  CreateSubtaskDto,
  UpdateFiveWhysDto,
  UpdateSubtaskDto,
} from './dto/subtask.dto';

@Injectable()
export class CapasService {
  constructor(
    @InjectRepository(Capa) private readonly capaRepo: Repository<Capa>,
    @InjectRepository(CapaSubtask)
    private readonly subtaskRepo: Repository<CapaSubtask>,
    @InjectRepository(NonConformity)
    private readonly ncRepo: Repository<NonConformity>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
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
      relations: [
        'createdBy',
        'assignedTo',
        'validatedBy',
        'nonConformities',
        'subtasks',
        'subtasks.assignee',
      ],
      order: { subtasks: { createdAt: 'ASC' } as never },
    });
    if (!capa) throw new NotFoundException();
    if (capa.organizationId !== actor.organizationId) {
      throw new ForbiddenException();
    }
    return capa;
  }

  /** Internal loader without actor check (used by subtask ops after the caller has already checked org). */
  private async loadOrThrow(id: string): Promise<Capa> {
    const capa = await this.capaRepo.findOne({ where: { id } });
    if (!capa) throw new NotFoundException('CAPA not found');
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
      fiveWhys: [],
    });
    const saved = await this.capaRepo.save(capa);
    await this.audit.log(actor, 'create', 'CAPA', saved.id, {
      code: saved.code,
    });
    return saved;
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateCapaDto) {
    const capa = await this.findOne(actor, id);
    if (
      capa.status === CAPAStatus.CLOSED ||
      capa.status === CAPAStatus.PENDING_VALIDATION
    ) {
      throw new BadRequestException(
        `CAPA is ${capa.status}; reopen it before editing.`,
      );
    }
    if (dto.title !== undefined) capa.title = dto.title;
    if (dto.description !== undefined) capa.description = dto.description;
    if (dto.rootCause !== undefined) capa.rootCause = dto.rootCause;
    if (dto.correctiveAction !== undefined)
      capa.correctiveAction = dto.correctiveAction;
    if (dto.preventiveAction !== undefined)
      capa.preventiveAction = dto.preventiveAction;
    if (dto.verification !== undefined) capa.verification = dto.verification;
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

  // ---------------------------------------------------------------------
  // 5-Whys / Root cause
  // ---------------------------------------------------------------------
  async updateFiveWhys(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateFiveWhysDto,
  ) {
    const capa = await this.findOne(actor, id);
    if (
      capa.status === CAPAStatus.CLOSED ||
      capa.status === CAPAStatus.PENDING_VALIDATION
    ) {
      throw new BadRequestException(
        `CAPA is ${capa.status}; reopen it before editing root cause.`,
      );
    }
    const cleaned = (dto.fiveWhys ?? []).map((w) => (w ?? '').toString());
    capa.fiveWhys = cleaned;
    if (dto.rootCause !== undefined) capa.rootCause = dto.rootCause;
    const saved = await this.capaRepo.save(capa);
    await this.audit.log(actor, 'update_five_whys', 'CAPA', id, {
      whysCount: cleaned.filter((w) => w.trim().length > 0).length,
      rootCauseSet: Boolean(capa.rootCause && capa.rootCause.trim()),
    });
    return saved;
  }

  // ---------------------------------------------------------------------
  // Subtasks
  // ---------------------------------------------------------------------
  async listSubtasks(actor: AuthenticatedUser, capaId: string) {
    await this.findOne(actor, capaId);
    return this.subtaskRepo.find({
      where: { capaId },
      relations: ['assignee', 'completedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async mySubtasks(actor: AuthenticatedUser) {
    if (!actor.organizationId) {
      throw new BadRequestException('User has no organization');
    }
    return this.subtaskRepo.find({
      where: {
        organizationId: actor.organizationId,
        assigneeId: actor.userId,
      },
      relations: ['capa'],
      order: { createdAt: 'DESC' },
    });
  }

  async createSubtask(
    actor: AuthenticatedUser,
    capaId: string,
    dto: CreateSubtaskDto,
  ) {
    const capa = await this.findOne(actor, capaId);
    if (capa.status === CAPAStatus.CLOSED) {
      throw new BadRequestException('Cannot add subtasks to a closed CAPA');
    }
    if (dto.assigneeId) {
      const assignee = await this.userRepo.findOne({
        where: { id: dto.assigneeId },
      });
      if (!assignee || assignee.organizationId !== capa.organizationId) {
        throw new BadRequestException('Invalid assignee');
      }
    }
    const subtask = this.subtaskRepo.create({
      capaId: capa.id,
      organizationId: capa.organizationId,
      title: dto.title,
      description: dto.description ?? null,
      assigneeId: dto.assigneeId ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      status: CapaSubtaskStatus.TODO,
      createdById: actor.userId,
    });
    const saved = await this.subtaskRepo.save(subtask);
    await this.audit.log(actor, 'create', 'CapaSubtask', saved.id, {
      capaId: capa.id,
      title: saved.title,
      assigneeId: saved.assigneeId,
    });
    return saved;
  }

  async updateSubtask(
    actor: AuthenticatedUser,
    subtaskId: string,
    dto: UpdateSubtaskDto,
  ) {
    const sub = await this.subtaskRepo.findOne({ where: { id: subtaskId } });
    if (!sub) throw new NotFoundException();
    if (sub.organizationId !== actor.organizationId) {
      throw new ForbiddenException();
    }

    const capa = await this.loadOrThrow(sub.capaId);
    if (capa.status === CAPAStatus.CLOSED) {
      throw new BadRequestException('CAPA is closed');
    }

    const isManager =
      actor.role === Role.QUALITY_MANAGER || actor.role === Role.ADMIN_OWNER;
    const isAssignee = sub.assigneeId === actor.userId;

    // Who can edit what:
    // - Managers (QM / admin_owner): all fields.
    // - Assignee: only status.
    if (!isManager && !isAssignee) throw new ForbiddenException();
    if (!isManager) {
      const forbiddenFields =
        dto.title !== undefined ||
        dto.description !== undefined ||
        dto.assigneeId !== undefined ||
        dto.dueDate !== undefined;
      if (forbiddenFields) throw new ForbiddenException();
    }

    if (dto.title !== undefined) sub.title = dto.title;
    if (dto.description !== undefined) sub.description = dto.description;
    if (dto.assigneeId !== undefined) {
      if (dto.assigneeId) {
        const u = await this.userRepo.findOne({
          where: { id: dto.assigneeId },
        });
        if (!u || u.organizationId !== sub.organizationId) {
          throw new BadRequestException('Invalid assignee');
        }
      }
      sub.assigneeId = dto.assigneeId ?? null;
    }
    if (dto.dueDate !== undefined) {
      sub.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.status !== undefined && dto.status !== sub.status) {
      sub.status = dto.status;
      if (dto.status === CapaSubtaskStatus.DONE) {
        sub.completedAt = new Date();
        sub.completedById = actor.userId;
      } else {
        sub.completedAt = null;
        sub.completedById = null;
      }
      // Auto-move CAPA from OPEN/REOPENED to IN_PROGRESS once any subtask leaves TODO.
      if (
        (capa.status === CAPAStatus.OPEN ||
          capa.status === CAPAStatus.REOPENED) &&
        dto.status !== CapaSubtaskStatus.TODO
      ) {
        capa.status = CAPAStatus.IN_PROGRESS;
        await this.capaRepo.save(capa);
        await this.audit.log(actor, 'auto_in_progress', 'CAPA', capa.id, {
          trigger: 'subtask_status_change',
          subtaskId: sub.id,
        });
      }
    }

    const saved = await this.subtaskRepo.save(sub);
    await this.audit.log(actor, 'update', 'CapaSubtask', sub.id, { ...dto });
    return saved;
  }

  async removeSubtask(actor: AuthenticatedUser, subtaskId: string) {
    if (
      actor.role !== Role.QUALITY_MANAGER &&
      actor.role !== Role.ADMIN_OWNER
    ) {
      throw new ForbiddenException();
    }
    const sub = await this.subtaskRepo.findOne({ where: { id: subtaskId } });
    if (!sub) throw new NotFoundException();
    if (sub.organizationId !== actor.organizationId) {
      throw new ForbiddenException();
    }
    const capa = await this.loadOrThrow(sub.capaId);
    if (capa.status === CAPAStatus.CLOSED) {
      throw new BadRequestException('CAPA is closed');
    }
    await this.subtaskRepo.remove(sub);
    await this.audit.log(actor, 'delete', 'CapaSubtask', subtaskId, {
      capaId: sub.capaId,
    });
    return { success: true };
  }

  // ---------------------------------------------------------------------
  // Workflow transitions
  // ---------------------------------------------------------------------
  async submitForValidation(actor: AuthenticatedUser, id: string) {
    const capa = await this.findOne(actor, id);
    if (
      capa.status !== CAPAStatus.IN_PROGRESS &&
      capa.status !== CAPAStatus.OPEN &&
      capa.status !== CAPAStatus.REOPENED
    ) {
      throw new BadRequestException(
        `Cannot submit for validation from status '${capa.status}'`,
      );
    }
    const filledWhys = (capa.fiveWhys ?? []).filter(
      (w) => (w ?? '').toString().trim().length > 0,
    );
    if (filledWhys.length < 1) {
      throw new BadRequestException(
        'At least one "Why?" must be filled before submitting for validation',
      );
    }
    if (!capa.rootCause || !capa.rootCause.trim()) {
      throw new BadRequestException(
        'Root cause is required before submitting for validation',
      );
    }
    const subs = await this.subtaskRepo.find({ where: { capaId: capa.id } });
    if (subs.length === 0) {
      throw new BadRequestException(
        'At least one subtask is required before submitting for validation',
      );
    }
    const unfinished = subs.filter((s) => s.status !== CapaSubtaskStatus.DONE);
    if (unfinished.length) {
      throw new BadRequestException(
        `${unfinished.length} subtask(s) still not done`,
      );
    }
    capa.status = CAPAStatus.PENDING_VALIDATION;
    capa.submittedForValidationAt = new Date();
    const saved = await this.capaRepo.save(capa);
    await this.audit.log(actor, 'submit_for_validation', 'CAPA', capa.id);
    return saved;
  }

  async validate(actor: AuthenticatedUser, id: string) {
    if (actor.role !== Role.QUALITY_MANAGER) {
      throw new ForbiddenException('Only the Quality Manager can validate');
    }
    const capa = await this.findOne(actor, id);
    if (capa.status !== CAPAStatus.PENDING_VALIDATION) {
      throw new BadRequestException(
        `Cannot validate from status '${capa.status}'`,
      );
    }
    capa.status = CAPAStatus.CLOSED;
    capa.validatedById = actor.userId;
    capa.validatedAt = new Date();
    capa.closedAt = new Date();
    const saved = await this.capaRepo.save(capa);

    // Close linked NCs.
    const ncs = await this.ncRepo.find({ where: { capaId: capa.id } });
    if (ncs.length) {
      for (const nc of ncs) {
        nc.status = NCStatus.CLOSED;
      }
      await this.ncRepo.save(ncs);
    }

    await this.audit.log(actor, 'validate_and_close', 'CAPA', capa.id, {
      linkedNCs: ncs.map((n) => n.id),
    });
    return saved;
  }

  async reject(actor: AuthenticatedUser, id: string, reason?: string) {
    if (actor.role !== Role.QUALITY_MANAGER) {
      throw new ForbiddenException('Only the Quality Manager can reject');
    }
    const capa = await this.findOne(actor, id);
    if (capa.status !== CAPAStatus.PENDING_VALIDATION) {
      throw new BadRequestException(
        `Cannot reject from status '${capa.status}'`,
      );
    }
    capa.status = CAPAStatus.IN_PROGRESS;
    capa.submittedForValidationAt = null;
    const saved = await this.capaRepo.save(capa);
    await this.audit.log(actor, 'reject_validation', 'CAPA', capa.id, {
      reason: reason ?? null,
    });
    return saved;
  }

  async reopen(actor: AuthenticatedUser, id: string, reason?: string) {
    if (actor.role !== Role.QUALITY_MANAGER) {
      throw new ForbiddenException('Only the Quality Manager can reopen');
    }
    const capa = await this.findOne(actor, id);
    if (capa.status !== CAPAStatus.CLOSED) {
      throw new BadRequestException('Only closed CAPAs can be reopened');
    }
    capa.status = CAPAStatus.REOPENED;
    capa.validatedById = null;
    capa.validatedAt = null;
    capa.closedAt = null;
    capa.submittedForValidationAt = null;
    const saved = await this.capaRepo.save(capa);

    // Reopen linked NCs too.
    const ncs = await this.ncRepo.find({
      where: { capaId: capa.id, status: In([NCStatus.CLOSED]) },
    });
    if (ncs.length) {
      for (const nc of ncs) {
        nc.status = NCStatus.LINKED;
      }
      await this.ncRepo.save(ncs);
    }

    await this.audit.log(actor, 'reopen', 'CAPA', capa.id, {
      reason: reason ?? null,
    });
    return saved;
  }

  // ---------------------------------------------------------------------
  // NC → CAPA promotion
  // ---------------------------------------------------------------------
  async promoteFromNc(
    actor: AuthenticatedUser,
    ncId: string,
    overrides: { title?: string; code?: string } = {},
  ) {
    if (
      actor.role !== Role.QUALITY_MANAGER &&
      actor.role !== Role.ADMIN_OWNER
    ) {
      throw new ForbiddenException();
    }
    if (!actor.organizationId) {
      throw new BadRequestException('User has no organization');
    }
    const nc = await this.ncRepo.findOne({ where: { id: ncId } });
    if (!nc) throw new NotFoundException('NC not found');
    if (nc.organizationId !== actor.organizationId) {
      throw new ForbiddenException();
    }
    if (nc.capaId) {
      throw new BadRequestException('NC is already linked to a CAPA');
    }

    const code =
      overrides.code ?? (await this.nextCapaCode(actor.organizationId));
    const title = overrides.title ?? `CAPA for ${nc.title}`.slice(0, 200);

    const capa = this.capaRepo.create({
      code,
      title,
      description: nc.description,
      rootCause: null,
      correctiveAction: null,
      preventiveAction: null,
      verification: null,
      fiveWhys: [],
      status: CAPAStatus.OPEN,
      organizationId: actor.organizationId,
      createdById: actor.userId,
      assignedToId: actor.userId,
    });
    const savedCapa = await this.capaRepo.save(capa);

    nc.capaId = savedCapa.id;
    nc.status = NCStatus.UNDER_INVESTIGATION;
    await this.ncRepo.save(nc);

    await this.audit.log(actor, 'promote_to_capa', 'NonConformity', nc.id, {
      capaId: savedCapa.id,
      capaCode: savedCapa.code,
    });
    await this.audit.log(actor, 'create_from_nc', 'CAPA', savedCapa.id, {
      ncId: nc.id,
    });
    return savedCapa;
  }

  private async nextCapaCode(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CAPA-${year}-`;
    const last = await this.capaRepo
      .createQueryBuilder('c')
      .where('c.organizationId = :org', { org: organizationId })
      .andWhere('c.code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('c.code', 'DESC')
      .limit(1)
      .getOne();
    let next = 1;
    if (last) {
      const n = parseInt(last.code.slice(prefix.length), 10);
      if (Number.isFinite(n)) next = n + 1;
    }
    return `${prefix}${String(next).padStart(4, '0')}`;
  }
}
