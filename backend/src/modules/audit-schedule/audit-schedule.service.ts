import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditSchedule,
  AuditStatus,
} from '../../entities/audit-schedule.entity';
import { AuditChecklistItem } from '../../entities/audit-checklist-item.entity';
import {
  AuditFinding,
  FindingStatus,
} from '../../entities/audit-finding.entity';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import {
  CreateAuditScheduleDto,
  CreateFindingDto,
  UpdateAuditScheduleDto,
  UpdateChecklistItemDto,
} from './dto/audit-schedule.dto';

@Injectable()
export class AuditScheduleService {
  constructor(
    @InjectRepository(AuditSchedule)
    private readonly scheduleRepo: Repository<AuditSchedule>,
    @InjectRepository(AuditChecklistItem)
    private readonly checklistRepo: Repository<AuditChecklistItem>,
    @InjectRepository(AuditFinding)
    private readonly findingRepo: Repository<AuditFinding>,
    private readonly auditService: AuditService,
  ) {}

  async list(user: AuthenticatedUser): Promise<AuditSchedule[]> {
    return this.scheduleRepo.find({
      where: { organizationId: user.organizationId! },
      relations: [
        'auditor',
        'auditee',
        'createdBy',
        'checklistItems',
        'findings',
      ],
      order: { plannedDate: 'DESC' },
    });
  }

  async findOne(user: AuthenticatedUser, id: string): Promise<AuditSchedule> {
    const audit = await this.scheduleRepo.findOne({
      where: { id, organizationId: user.organizationId! },
      relations: [
        'auditor',
        'auditee',
        'createdBy',
        'checklistItems',
        'findings',
      ],
    });
    if (!audit) throw new NotFoundException('Audit not found');
    return audit;
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateAuditScheduleDto,
  ): Promise<AuditSchedule> {
    if (!user.organizationId) throw new ForbiddenException('No organization');

    const audit = this.scheduleRepo.create({
      ...dto,
      organizationId: user.organizationId,
      createdById: user.userId,
      plannedDate: new Date(dto.plannedDate),
    });

    const saved = await this.scheduleRepo.save(audit);

    if (dto.checklistItems?.length) {
      const items = dto.checklistItems.map((ci) =>
        this.checklistRepo.create({
          ...ci,
          auditId: saved.id,
          organizationId: user.organizationId!,
        }),
      );
      await this.checklistRepo.save(items);
    }

    await this.auditService.log(user, 'CREATE', 'AuditSchedule', saved.id);
    return this.findOne(user, saved.id);
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateAuditScheduleDto,
  ): Promise<AuditSchedule> {
    const audit = await this.findOne(user, id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { plannedDate: _plannedStr, ...rest } = dto;
    const updateData: Partial<AuditSchedule> = { ...rest };
    if (dto.plannedDate) {
      updateData.plannedDate = new Date(dto.plannedDate);
    }
    if (dto.status === AuditStatus.COMPLETED) {
      updateData.completionDate = new Date();
    }
    Object.assign(audit, updateData);
    await this.scheduleRepo.save(audit);
    await this.auditService.log(user, 'UPDATE', 'AuditSchedule', id);
    return this.findOne(user, id);
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    const audit = await this.findOne(user, id);
    await this.scheduleRepo.remove(audit);
    await this.auditService.log(user, 'DELETE', 'AuditSchedule', id);
  }

  async updateChecklistItem(
    user: AuthenticatedUser,
    itemId: string,
    dto: UpdateChecklistItemDto,
  ): Promise<AuditChecklistItem> {
    const item = await this.checklistRepo.findOne({
      where: { id: itemId, organizationId: user.organizationId! },
    });
    if (!item) throw new NotFoundException('Checklist item not found');
    Object.assign(item, dto);
    await this.checklistRepo.save(item);
    await this.auditService.log(user, 'UPDATE', 'AuditChecklistItem', itemId);
    return item;
  }

  async addFinding(
    user: AuthenticatedUser,
    auditId: string,
    dto: CreateFindingDto,
  ): Promise<AuditFinding> {
    await this.findOne(user, auditId);
    const finding = this.findingRepo.create({
      ...dto,
      auditId,
      organizationId: user.organizationId!,
    });
    const saved = await this.findingRepo.save(finding);
    await this.auditService.log(user, 'CREATE', 'AuditFinding', saved.id);
    return saved;
  }

  async closeFinding(
    user: AuthenticatedUser,
    findingId: string,
  ): Promise<AuditFinding> {
    const finding = await this.findingRepo.findOne({
      where: { id: findingId, organizationId: user.organizationId! },
    });
    if (!finding) throw new NotFoundException('Finding not found');
    finding.status = FindingStatus.CLOSED;
    finding.closedById = user.userId;
    finding.closedDate = new Date();
    await this.findingRepo.save(finding);
    await this.auditService.log(user, 'UPDATE', 'AuditFinding', findingId);
    return finding;
  }
}
