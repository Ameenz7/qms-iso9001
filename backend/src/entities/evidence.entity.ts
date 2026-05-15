import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { EvidenceEntityType } from '../common/enums/evidence-type.enum';

@Entity('evidences')
export class Evidence {
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
  entityId!: string;

  @Column({ type: 'enum', enum: EvidenceEntityType })
  entityType!: EvidenceEntityType;

  @Column()
  fileUrl!: string;

  @Column()
  fileName!: string;

  @Column()
  fileType!: string;

  @Column({ type: 'int' })
  fileSize!: number;

  @Column({ type: 'uuid' })
  uploadedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
