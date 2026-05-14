import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NonConformity } from '../../entities/non-conformity.entity';
import { Capa } from '../../entities/capa.entity';
import { CapaSubtask } from '../../entities/capa-subtask.entity';
import { QmsDocument } from '../../entities/document.entity';
import { AuditSchedule } from '../../entities/audit-schedule.entity';
import { CorrectiveAction } from '../../entities/corrective-action.entity';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(NonConformity)
    private readonly ncRepo: Repository<NonConformity>,
    @InjectRepository(Capa)
    private readonly capaRepo: Repository<Capa>,
    @InjectRepository(CapaSubtask)
    private readonly subtaskRepo: Repository<CapaSubtask>,
    @InjectRepository(QmsDocument)
    private readonly docRepo: Repository<QmsDocument>,
    @InjectRepository(AuditSchedule)
    private readonly auditRepo: Repository<AuditSchedule>,
    @InjectRepository(CorrectiveAction)
    private readonly actionRepo: Repository<CorrectiveAction>,
  ) {}

  async getKpis(user: AuthenticatedUser) {
    const orgId = user.organizationId;
    if (!orgId) return this.emptyKpis();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      ncTotal,
      ncOpen,
      ncClosedMonth,
      ncCritical,
      capaTotal,
      capaOpen,
      docsTotal,
      docsDraft,
      docsApproved,
      auditsScheduled,
      auditsCompleted,
      actionsTotal,
      actionsPending,
      actionsOverdue,
    ] = await Promise.all([
      this.ncRepo.count({ where: { organizationId: orgId } }),
      this.ncRepo.count({
        where: {
          organizationId: orgId,
          status: In(['submitted', 'under_review', 'under_investigation']),
        },
      }),
      this.ncRepo
        .createQueryBuilder('nc')
        .where('nc.organizationId = :orgId', { orgId })
        .andWhere('nc.status = :status', { status: 'closed' })
        .andWhere('nc.updatedAt >= :monthStart', { monthStart })
        .getCount(),
      this.ncRepo.count({
        where: { organizationId: orgId, severity: 'critical' as never },
      }),
      this.capaRepo.count({ where: { organizationId: orgId } }),
      this.capaRepo.count({
        where: { organizationId: orgId, status: In(['open', 'in_progress']) },
      }),
      this.docRepo.count({ where: { organizationId: orgId } }),
      this.docRepo.count({
        where: { organizationId: orgId, status: 'draft' as never },
      }),
      this.docRepo.count({
        where: { organizationId: orgId, status: 'approved' as never },
      }),
      this.auditRepo.count({
        where: { organizationId: orgId, status: 'scheduled' as never },
      }),
      this.auditRepo.count({
        where: { organizationId: orgId, status: 'completed' as never },
      }),
      this.actionRepo.count({ where: { organizationId: orgId } }),
      this.actionRepo.count({
        where: { organizationId: orgId, status: 'pending' as never },
      }),
      this.actionRepo
        .createQueryBuilder('a')
        .where('a.organizationId = :orgId', { orgId })
        .andWhere('a.status != :done', { done: 'completed' })
        .andWhere('a.status != :verified', { verified: 'verified' })
        .andWhere('a.dueDate < :now', { now })
        .getCount(),
    ]);

    return {
      nc: {
        total: ncTotal,
        open: ncOpen,
        closedThisMonth: ncClosedMonth,
        critical: ncCritical,
      },
      capa: { total: capaTotal, open: capaOpen },
      documents: { total: docsTotal, draft: docsDraft, approved: docsApproved },
      audits: { scheduled: auditsScheduled, completed: auditsCompleted },
      actions: {
        total: actionsTotal,
        pending: actionsPending,
        overdue: actionsOverdue,
      },
    };
  }

  async getChartData(user: AuthenticatedUser) {
    const orgId = user.organizationId;
    if (!orgId)
      return {
        ncTrend: [],
        ncByDepartment: [],
        actionsByStatus: [],
        docsByStatus: [],
      };

    const months: { month: string; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = await this.ncRepo
        .createQueryBuilder('nc')
        .where('nc.organizationId = :orgId', { orgId })
        .andWhere('nc.createdAt >= :start', { start: d })
        .andWhere('nc.createdAt <= :end', { end })
        .getCount();
      months.push({
        month: d.toISOString().slice(0, 7),
        count,
      });
    }

    const ncByDept = await this.ncRepo
      .createQueryBuilder('nc')
      .select('nc.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .where('nc.organizationId = :orgId', { orgId })
      .andWhere('nc.department IS NOT NULL')
      .groupBy('nc.department')
      .getRawMany();

    const actionsByStatus = await this.actionRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('a.organizationId = :orgId', { orgId })
      .groupBy('a.status')
      .getRawMany();

    const docsByStatus = await this.docRepo
      .createQueryBuilder('d')
      .select('d.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('d.organizationId = :orgId', { orgId })
      .groupBy('d.status')
      .getRawMany();

    return {
      ncTrend: months,
      ncByDepartment: ncByDept,
      actionsByStatus,
      docsByStatus,
    };
  }

  async getMyTasks(user: AuthenticatedUser) {
    const orgId = user.organizationId;
    if (!orgId) return [];

    const subtasks = await this.subtaskRepo.find({
      where: { assigneeId: user.userId, organizationId: orgId },
      relations: ['capa'],
      order: { dueDate: 'ASC' },
    });

    const actions = await this.actionRepo.find({
      where: { assignedToId: user.userId, organizationId: orgId },
      relations: ['nc'],
      order: { dueDate: 'ASC' },
    });

    const tasks = [
      ...subtasks.map((s) => ({
        id: s.id,
        type: 'subtask' as const,
        title: s.title,
        status: s.status,
        dueDate: s.dueDate,
        reference: s.capa ? `CAPA: ${s.capa.code}` : null,
        link: s.capaId ? `/capas/${s.capaId}` : null,
      })),
      ...actions.map((a) => ({
        id: a.id,
        type: 'action' as const,
        title: a.description,
        status: a.status,
        dueDate: a.dueDate,
        reference: a.nc ? `NC: ${a.nc.reference ?? a.nc.title}` : null,
        link: a.ncId ? `/non-conformities` : null,
      })),
    ];

    tasks.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return tasks;
  }

  private emptyKpis() {
    return {
      nc: { total: 0, open: 0, closedThisMonth: 0, critical: 0 },
      capa: { total: 0, open: 0 },
      documents: { total: 0, draft: 0, approved: 0 },
      audits: { scheduled: 0, completed: 0 },
      actions: { total: 0, pending: 0, overdue: 0 },
    };
  }
}
