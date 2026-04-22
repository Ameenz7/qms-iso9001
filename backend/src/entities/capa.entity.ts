import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CAPAStatus } from '../common/enums/status.enum';
import { CapaSubtask } from './capa-subtask.entity';
import { NonConformity } from './non-conformity.entity';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('capas')
export class Capa {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  rootCause!: string | null;

  @Column({ type: 'text', nullable: true })
  correctiveAction!: string | null;

  @Column({ type: 'text', nullable: true })
  preventiveAction!: string | null;

  @Column({ type: 'text', nullable: true })
  verification!: string | null;

  @Column({ type: 'enum', enum: CAPAStatus, default: CAPAStatus.OPEN })
  status!: CAPAStatus;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate!: Date | null;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @Column({ type: 'uuid' })
  createdById!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo!: User | null;

  @Column({ type: 'uuid', nullable: true })
  assignedToId!: string | null;

  @OneToMany(() => NonConformity, (nc) => nc.capa)
  nonConformities!: NonConformity[];

  @OneToMany(() => CapaSubtask, (s) => s.capa, { cascade: false })
  subtasks!: CapaSubtask[];

  /** Ordered list of up to 5 "why" answers for root-cause analysis. */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  fiveWhys!: string[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'validatedById' })
  validatedBy!: User | null;

  @Column({ type: 'uuid', nullable: true })
  validatedById!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  validatedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  submittedForValidationAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
