import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { AuditSchedule } from './audit-schedule.entity';

export enum FindingSeverity {
  MINOR = 'minor',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

export enum FindingStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Entity('audit_findings')
export class AuditFinding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Index()
  @Column('uuid')
  auditId!: string;

  @ManyToOne(() => AuditSchedule, (a) => a.findings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auditId' })
  audit!: AuditSchedule;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: FindingSeverity })
  severity!: FindingSeverity;

  @Column({ type: 'varchar', nullable: true })
  category!: string | null;

  @Column({ type: 'uuid', nullable: true })
  referenceNcId!: string | null;

  @Column({
    type: 'enum',
    enum: FindingStatus,
    default: FindingStatus.OPEN,
  })
  status!: FindingStatus;

  @Column({ type: 'uuid', nullable: true })
  closedById!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'closedById' })
  closedBy!: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  closedDate!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
