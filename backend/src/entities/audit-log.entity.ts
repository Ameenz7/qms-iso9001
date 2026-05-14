import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  organizationId!: string | null;

  @Column()
  action!: string;

  @Index()
  @Column()
  entity!: string;

  @Column({ nullable: true })
  entityId!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  oldValues!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  newValues!: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  hashChain!: string | null;

  @CreateDateColumn()
  @Index()
  createdAt!: Date;
}
