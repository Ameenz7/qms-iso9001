import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NonConformity } from '../../entities/non-conformity.entity';
import { QmsDocument } from '../../entities/document.entity';
import { AuditSchedule } from '../../entities/audit-schedule.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

export interface ExportRow {
  [key: string]: string | number | boolean | null | undefined;
}

@Injectable()
export class ExportsService {
  constructor(
    @InjectRepository(NonConformity)
    private readonly ncRepo: Repository<NonConformity>,
    @InjectRepository(QmsDocument)
    private readonly docRepo: Repository<QmsDocument>,
    @InjectRepository(AuditSchedule)
    private readonly auditRepo: Repository<AuditSchedule>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async exportNcs(user: AuthenticatedUser): Promise<ExportRow[]> {
    if (!user.organizationId) throw new ForbiddenException('No organization');
    const ncs = await this.ncRepo.find({
      where: { organizationId: user.organizationId },
      relations: ['submittedBy', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
    return ncs.map((nc) => ({
      Reference: nc.reference,
      Title: nc.title,
      Description: nc.description,
      Severity: nc.severity,
      Status: nc.status,
      Area: nc.area,
      Department: nc.department,
      'Detection Method': nc.detectionMethod,
      'Submitted By': nc.submittedBy
        ? `${nc.submittedBy.firstName} ${nc.submittedBy.lastName}`
        : '',
      'Assigned To': nc.assignedTo
        ? `${nc.assignedTo.firstName} ${nc.assignedTo.lastName}`
        : '',
      'Created At': nc.createdAt?.toISOString(),
    }));
  }

  async exportDocuments(user: AuthenticatedUser): Promise<ExportRow[]> {
    if (!user.organizationId) throw new ForbiddenException('No organization');
    const docs = await this.docRepo.find({
      where: { organizationId: user.organizationId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
    return docs.map((d) => ({
      Code: d.code,
      Title: d.title,
      Version: d.version,
      Status: d.status,
      'Created By': d.createdBy
        ? `${d.createdBy.firstName} ${d.createdBy.lastName}`
        : '',
      'Created At': d.createdAt?.toISOString(),
    }));
  }

  async exportAudits(user: AuthenticatedUser): Promise<ExportRow[]> {
    if (!user.organizationId) throw new ForbiddenException('No organization');
    const audits = await this.auditRepo.find({
      where: { organizationId: user.organizationId },
      relations: ['auditor', 'auditee', 'createdBy'],
      order: { plannedDate: 'DESC' },
    });
    return audits.map((a) => ({
      Title: a.title,
      Type: a.type,
      Status: a.status,
      Frequency: a.frequency,
      'Planned Date': a.plannedDate?.toISOString(),
      Scope: a.scope,
      Auditor: a.auditor ? `${a.auditor.firstName} ${a.auditor.lastName}` : '',
      Auditee: a.auditee ? `${a.auditee.firstName} ${a.auditee.lastName}` : '',
      'Completion Date': a.completionDate?.toISOString(),
    }));
  }

  async exportAuditLogs(user: AuthenticatedUser): Promise<ExportRow[]> {
    if (!user.organizationId) throw new ForbiddenException('No organization');
    const logs = await this.auditLogRepo.find({
      where: { organizationId: user.organizationId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 5000,
    });
    return logs.map((l) => ({
      Action: l.action,
      Entity: l.entity,
      'Entity ID': l.entityId,
      User: l.user ? `${l.user.firstName} ${l.user.lastName}` : '',
      'IP Address': l.ipAddress,
      'Created At': l.createdAt?.toISOString(),
    }));
  }

  toCsv(rows: ExportRow[]): string {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(','),
      ),
    ];
    return lines.join('\n');
  }
}
