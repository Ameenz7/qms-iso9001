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
import { NonConformity } from './non-conformity.entity';
import { CorrectiveAction } from './corrective-action.entity';

export enum CauseType {
  HUMAN = 'human',
  PROCESS = 'process',
  MATERIAL = 'material',
  MACHINE = 'machine',
  ENVIRONMENT = 'environment',
  METHOD = 'method',
}

export enum VerificationStatus {
  TO_VERIFY = 'to_verify',
  CONFIRMED = 'confirmed',
  UNCONFIRMED = 'unconfirmed',
}

export enum Likelihood {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Entity('root_causes')
export class RootCause {
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
  ncId!: string;

  @ManyToOne(() => NonConformity, (nc) => nc.rootCauses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ncId' })
  nc!: NonConformity;

  @Column({ type: 'text' })
  hypothesis!: string;

  @Column({ type: 'enum', enum: CauseType })
  causeType!: CauseType;

  @Column({ type: 'text', nullable: true })
  verificationMethod!: string | null;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.TO_VERIFY,
  })
  verificationStatus!: VerificationStatus;

  @Column({ type: 'uuid', nullable: true })
  verifiedById!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy!: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Column({ type: 'enum', enum: Likelihood, default: Likelihood.MEDIUM })
  likelihood!: Likelihood;

  @Column({ default: false })
  isPrimary!: boolean;

  @OneToMany(() => CorrectiveAction, (a) => a.rootCause)
  actions!: CorrectiveAction[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
