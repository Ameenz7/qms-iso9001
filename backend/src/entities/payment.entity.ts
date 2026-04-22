import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  organizationId!: string;

  @ManyToOne(() => Organization, (o) => o.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount!: string;

  @Column({ type: 'int', default: 1 })
  monthsCovered!: number;

  @Column({ type: 'timestamptz' })
  paidAt!: Date;

  @Column({ type: 'timestamptz' })
  coversUntil!: Date;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column('uuid', { nullable: true })
  recordedById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recordedById' })
  recordedBy!: User | null;

  @CreateDateColumn()
  createdAt!: Date;
}
