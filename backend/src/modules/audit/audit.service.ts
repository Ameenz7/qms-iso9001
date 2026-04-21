import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(
    user: AuthenticatedUser | null,
    action: string,
    entity: string,
    entityId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const log = this.auditRepo.create({
      userId: user?.userId ?? null,
      organizationId: user?.organizationId ?? null,
      action,
      entity,
      entityId,
      metadata: metadata ?? null,
    });
    await this.auditRepo.save(log);
  }

  async list(organizationId: string | null): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: organizationId ? { organizationId } : {},
      order: { createdAt: 'DESC' },
      take: 500,
    });
  }
}
