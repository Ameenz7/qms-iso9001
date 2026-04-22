import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Payment } from './payment.entity';
import { User } from './user.entity';

export enum OrganizationStatus {
  ACTIVE = 'active',
  GRACE = 'grace',
  SUSPENDED = 'suspended',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string | null;

  @Column({ type: 'varchar', length: 64, default: 'Starter' })
  plan!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  monthlyPrice!: string;

  @Column({ type: 'timestamptz', nullable: true })
  paidUntil!: Date | null;

  @Column({
    type: 'enum',
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVE,
  })
  status!: OrganizationStatus;

  @Column({ type: 'timestamptz', nullable: true })
  suspendedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  suspensionReason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @OneToMany(() => User, (user) => user.organization)
  users!: User[];

  @OneToMany(() => Payment, (p) => p.organization)
  payments!: Payment[];
}
