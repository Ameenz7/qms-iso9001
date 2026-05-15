import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { createHash } from 'crypto';
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
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
    trx?: EntityManager,
  ): Promise<void> {
    const lastLog = await this.auditRepo.findOne({
      where: {},
      order: { createdAt: 'DESC' },
      select: ['hashChain'],
    });
    const previousHash = lastLog?.hashChain ?? '0';

    const logData = {
      userId: user?.userId ?? null,
      organizationId: user?.organizationId ?? null,
      action,
      entity,
      entityId,
      metadata: metadata ?? null,
      oldValues: oldValues ?? null,
      newValues: newValues ?? null,
    };

    const currentHash = createHash('sha256')
      .update(previousHash + JSON.stringify(logData))
      .digest('hex');

    const log = this.auditRepo.create({
      ...logData,
      hashChain: currentHash,
    });

    if (trx) {
      await trx.getRepository(AuditLog).save(log);
    } else {
      await this.auditRepo.save(log);
    }
  }

  async list(
    organizationId: string | null,
    filters?: {
      entity?: string;
      action?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<AuditLog[]> {
    const qb = this.auditRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .take(500);

    if (organizationId) {
      qb.where('log.organizationId = :orgId', { orgId: organizationId });
    }
    if (filters?.entity) {
      qb.andWhere('log.entity = :entity', { entity: filters.entity });
    }
    if (filters?.action) {
      qb.andWhere('log.action = :action', { action: filters.action });
    }
    if (filters?.userId) {
      qb.andWhere('log.userId = :userId', { userId: filters.userId });
    }
    if (filters?.startDate) {
      qb.andWhere('log.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters?.endDate) {
      qb.andWhere('log.createdAt <= :endDate', { endDate: filters.endDate });
    }

    return qb.getMany();
  }
}
