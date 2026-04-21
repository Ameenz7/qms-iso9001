import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NCSeverity, NCStatus } from '../common/enums/status.enum';
import { Capa } from './capa.entity';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('non_conformities')
export class NonConformity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ nullable: true })
  area!: string;

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

  @ManyToOne(() => Capa, (c) => c.nonConformities, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'capaId' })
  capa!: Capa | null;

  @Column({ type: 'uuid', nullable: true })
  capaId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
