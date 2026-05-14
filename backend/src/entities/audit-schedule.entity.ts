import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { AuditChecklistItem } from './audit-checklist-item.entity';
import { AuditFinding } from './audit-finding.entity';

export enum AuditType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  SUPPLIER = 'supplier',
}

export enum AuditFrequency {
  ONCE = 'once',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

export enum AuditStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('audit_schedules')
export class AuditSchedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'enum', enum: AuditType })
  type!: AuditType;

  @Column()
  title!: string;

  @Column({
    type: 'enum',
    enum: AuditFrequency,
    default: AuditFrequency.ONCE,
  })
  frequency!: AuditFrequency;

  @Column({ type: 'timestamptz' })
  plannedDate!: Date;

  @Column({ type: 'text', nullable: true })
  scope!: string | null;

  @Column({ type: 'uuid', nullable: true })
  auditorId!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'auditorId' })
  auditor!: User | null;

  @Column({ type: 'uuid', nullable: true })
  auditeeId!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'auditeeId' })
  auditee!: User | null;

  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.SCHEDULED,
  })
  status!: AuditStatus;

  @Column({ type: 'timestamptz', nullable: true })
  completionDate!: Date | null;

  @Column({ type: 'uuid' })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @OneToMany(() => AuditChecklistItem, (ci) => ci.audit, { cascade: true })
  checklistItems!: AuditChecklistItem[];

  @OneToMany(() => AuditFinding, (f) => f.audit, { cascade: true })
  findings!: AuditFinding[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
