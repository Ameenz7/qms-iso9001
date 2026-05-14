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
import { NonConformity } from './non-conformity.entity';
import { RootCause } from './root-cause.entity';

export enum ActionType {
  CORRECTIVE = 'corrective',
  PREVENTIVE = 'preventive',
}

export enum ActionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  VERIFIED = 'verified',
}

export enum ActionPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Entity('corrective_actions')
export class CorrectiveAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'uuid', nullable: true })
  rootCauseId!: string | null;

  @ManyToOne(() => RootCause, (rc) => rc.actions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'rootCauseId' })
  rootCause!: RootCause | null;

  @Index()
  @Column('uuid')
  ncId!: string;

  @ManyToOne(() => NonConformity, (nc) => nc.correctiveActions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ncId' })
  nc!: NonConformity;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: ActionType })
  actionType!: ActionType;

  @Column({ type: 'uuid', nullable: true })
  assignedToId!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo!: User | null;

  @Column({
    type: 'enum',
    enum: ActionPriority,
    default: ActionPriority.MEDIUM,
  })
  priority!: ActionPriority;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate!: Date | null;

  @Column({
    type: 'enum',
    enum: ActionStatus,
    default: ActionStatus.PENDING,
  })
  status!: ActionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  completionDate!: Date | null;

  @Column({ default: false })
  effectivenessCheckRequired!: boolean;

  @Column({ default: false })
  effectivenessVerified!: boolean;

  @Column({ type: 'uuid' })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
