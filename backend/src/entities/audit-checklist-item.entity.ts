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
import { AuditSchedule } from './audit-schedule.entity';

export enum FindingType {
  CONFORM = 'conform',
  MINOR_NC = 'minor_nc',
  MAJOR_NC = 'major_nc',
  OBSERVATION = 'observation',
}

@Entity('audit_checklist_items')
export class AuditChecklistItem {
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

  @ManyToOne(() => AuditSchedule, (a) => a.checklistItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'auditId' })
  audit!: AuditSchedule;

  @Column({ type: 'int' })
  itemNumber!: number;

  @Column({ type: 'text' })
  requirement!: string;

  @Column({ type: 'boolean', default: false })
  evidenceRequired!: boolean;

  @Column({
    type: 'enum',
    enum: FindingType,
    nullable: true,
  })
  findingType!: FindingType | null;

  @Column({ type: 'text', nullable: true })
  findingDescription!: string | null;

  @Column({ type: 'boolean', default: false })
  correctiveActionRequired!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
