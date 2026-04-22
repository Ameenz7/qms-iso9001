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
import { CapaSubtaskStatus } from '../common/enums/status.enum';
import { Capa } from './capa.entity';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('capa_subtasks')
export class CapaSubtask {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  capaId!: string;

  @ManyToOne(() => Capa, (c) => c.subtasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'capaId' })
  capa!: Capa;

  @Index()
  @Column('uuid')
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: CapaSubtaskStatus,
    default: CapaSubtaskStatus.TODO,
  })
  status!: CapaSubtaskStatus;

  @Column({ type: 'uuid', nullable: true })
  assigneeId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigneeId' })
  assignee!: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  completedById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'completedById' })
  completedBy!: User | null;

  @Column('uuid')
  createdById!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
