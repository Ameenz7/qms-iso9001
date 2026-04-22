import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, LessThan, Not, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import {
  Organization,
  OrganizationStatus,
} from '../../entities/organization.entity';
import { Payment } from '../../entities/payment.entity';
import { User } from '../../entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  CreateOrganizationDto,
  RecordPaymentDto,
  SuspendOrganizationDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';

const GRACE_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30;

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.orgRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async create(actor: AuthenticatedUser, dto: CreateOrganizationDto) {
    const existing = await this.orgRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new BadRequestException('Organization name taken');

    const existingUser = await this.userRepo.findOne({
      where: { email: dto.ownerEmail.toLowerCase() },
    });
    if (existingUser) throw new BadRequestException('Owner email already used');

    return this.dataSource.transaction(async (trx) => {
      const org = trx.getRepository(Organization).create({
        name: dto.name,
        description: dto.description ?? null,
        plan: dto.plan ?? 'Starter',
        monthlyPrice: dto.monthlyPrice ?? '0',
        status: OrganizationStatus.ACTIVE,
      });
      const savedOrg = await trx.getRepository(Organization).save(org);

      const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);
      const owner = trx.getRepository(User).create({
        email: dto.ownerEmail.toLowerCase(),
        passwordHash,
        firstName: dto.ownerFirstName,
        lastName: dto.ownerLastName,
        role: Role.ADMIN_OWNER,
        organizationId: savedOrg.id,
      });
      await trx.getRepository(User).save(owner);

      await this.audit.log(actor, 'create', 'Organization', savedOrg.id, {
        name: savedOrg.name,
        ownerEmail: owner.email,
        plan: savedOrg.plan,
      });

      return savedOrg;
    });
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateOrganizationDto,
  ) {
    const org = await this.findOne(id);
    Object.assign(org, dto);
    const saved = await this.orgRepo.save(org);
    await this.audit.log(actor, 'update', 'Organization', id, { ...dto });
    return saved;
  }

  async remove(actor: AuthenticatedUser, id: string) {
    const org = await this.findOne(id);
    await this.orgRepo.softRemove(org);
    await this.audit.log(actor, 'delete', 'Organization', id);
    return { success: true };
  }

  async suspend(
    actor: AuthenticatedUser,
    id: string,
    dto: SuspendOrganizationDto,
  ) {
    const org = await this.findOne(id);
    org.status = OrganizationStatus.SUSPENDED;
    org.suspendedAt = new Date();
    org.suspensionReason = dto.reason ?? 'Manual suspension';
    const saved = await this.orgRepo.save(org);
    await this.audit.log(actor, 'suspend', 'Organization', id, {
      reason: org.suspensionReason,
    });
    return saved;
  }

  async unsuspend(actor: AuthenticatedUser, id: string) {
    const org = await this.findOne(id);
    org.status = this.deriveActiveStatus(org.paidUntil);
    org.suspendedAt = null;
    org.suspensionReason = null;
    const saved = await this.orgRepo.save(org);
    await this.audit.log(actor, 'unsuspend', 'Organization', id);
    return saved;
  }

  async recordPayment(
    actor: AuthenticatedUser,
    id: string,
    dto: RecordPaymentDto,
  ) {
    const org = await this.findOne(id);
    const now = new Date();
    const base = org.paidUntil && org.paidUntil > now ? org.paidUntil : now;
    const coversUntil = new Date(
      base.getTime() + dto.monthsCovered * DAYS_PER_MONTH * MS_PER_DAY,
    );

    return this.dataSource.transaction(async (trx) => {
      const payment = trx.getRepository(Payment).create({
        organizationId: id,
        amount: dto.amount,
        monthsCovered: dto.monthsCovered,
        paidAt: now,
        coversUntil,
        note: dto.note ?? null,
        recordedById: actor.userId,
      });
      const savedPayment = await trx.getRepository(Payment).save(payment);

      org.paidUntil = coversUntil;
      org.status = OrganizationStatus.ACTIVE;
      org.suspendedAt = null;
      org.suspensionReason = null;
      await trx.getRepository(Organization).save(org);

      await this.audit.log(actor, 'record-payment', 'Organization', id, {
        amount: dto.amount,
        monthsCovered: dto.monthsCovered,
        coversUntil: coversUntil.toISOString(),
      });

      return savedPayment;
    });
  }

  listPayments(id: string) {
    return this.paymentRepo.find({
      where: { organizationId: id },
      order: { paidAt: 'DESC' },
    });
  }

  private deriveActiveStatus(paidUntil: Date | null): OrganizationStatus {
    if (!paidUntil) return OrganizationStatus.ACTIVE;
    const now = new Date();
    if (paidUntil >= now) return OrganizationStatus.ACTIVE;
    const graceCutoff = new Date(paidUntil.getTime() + GRACE_DAYS * MS_PER_DAY);
    return now <= graceCutoff
      ? OrganizationStatus.GRACE
      : OrganizationStatus.SUSPENDED;
  }

  /**
   * Sweep all non-deleted orgs and update status based on paidUntil +
   * grace period. Called from a scheduled job. Never changes orgs that
   * were suspended manually without a payment context — i.e. if there
   * is no paidUntil at all, the org stays active.
   */
  async reconcileBillingStatuses(): Promise<number> {
    const orgs = await this.orgRepo.find({
      where: { paidUntil: Not(null as unknown as Date) },
    });
    let changed = 0;
    for (const org of orgs) {
      const target = this.deriveActiveStatus(org.paidUntil);
      if (org.status === target) continue;
      // Don't auto-unsuspend manual suspensions that have no payment overdue
      if (
        org.status === OrganizationStatus.SUSPENDED &&
        target !== OrganizationStatus.SUSPENDED &&
        org.suspensionReason &&
        !org.suspensionReason.startsWith('Auto:')
      ) {
        continue;
      }
      org.status = target;
      if (target === OrganizationStatus.SUSPENDED) {
        org.suspendedAt = new Date();
        org.suspensionReason = 'Auto: payment overdue past grace period';
      } else if (target === OrganizationStatus.ACTIVE) {
        org.suspendedAt = null;
        org.suspensionReason = null;
      }
      await this.orgRepo.save(org);
      changed += 1;
    }
    return changed;
  }

  /**
   * Quick count of overdue orgs for status widgets. (Not used yet but
   * handy for a future dashboard.)
   */
  countOverdue() {
    return this.orgRepo.count({
      where: { paidUntil: LessThan(new Date()) },
    });
  }
}
