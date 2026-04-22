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
import { QmsDocument } from './document.entity';

@Entity('document_attachments')
export class DocumentAttachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  documentId!: string;

  @ManyToOne(() => QmsDocument, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document!: QmsDocument;

  @Index()
  @Column('uuid')
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'int', default: 1 })
  documentVersion!: number;

  @Column({ type: 'varchar', length: 255 })
  filename!: string;

  @Column({ type: 'varchar', length: 128 })
  mimeType!: string;

  @Column({ type: 'bigint' })
  size!: string;

  @Column({ type: 'varchar', length: 64 })
  sha256!: string;

  @Column({ type: 'varchar', length: 512 })
  storageKey!: string;

  @Column({ type: 'uuid', nullable: true })
  uploadedById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy!: User | null;

  @CreateDateColumn()
  createdAt!: Date;
}
