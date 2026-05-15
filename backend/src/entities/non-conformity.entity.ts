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
import { NCSeverity, NCStatus } from '../common/enums/status.enum';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { RootCause } from './root-cause.entity';
import { CorrectiveAction } from './corrective-action.entity';

@Entity('non_conformities')
export class NonConformity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', nullable: true })
  reference!: string | null;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ nullable: true })
  area!: string;

  @Column({ type: 'varchar', nullable: true })
  department!: string | null;

  @Column({ type: 'varchar', nullable: true })
  detectionMethod!: string | null;

  @Column({ type: 'enum', enum: NCSeverity, default: NCSeverity.LOW })
  severity!: NCSeverity;

  @Column({ type: 'enum', enum: NCStatus, default: NCStatus.SUBMITTED })
  status!: NCStatus;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submittedById' })
  submittedBy!: User;

  @Column({ type: 'uuid' })
  submittedById!: string;

  @Column({ type: 'uuid', nullable: true })
  assignedToId!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo!: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  closureDate!: Date | null;

  @OneToMany(() => RootCause, (rc) => rc.nc, { cascade: true })
  rootCauses!: RootCause[];

  @OneToMany(() => CorrectiveAction, (a) => a.nc, { cascade: true })
  correctiveActions!: CorrectiveAction[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
