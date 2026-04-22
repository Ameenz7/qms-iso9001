import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QmsDocument } from './document.entity';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('document_shares')
export class DocumentShare {
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

  // bcrypt hash of the plaintext token (plaintext only lives in the URL the
  // sharer copies — never stored on the server)
  @Column({ type: 'varchar', length: 255 })
  tokenHash!: string;

  // first 12 chars of plaintext (non-secret) — lets us look up the right row
  // without bcrypt-comparing every row on every request.
  @Index()
  @Column({ type: 'varchar', length: 32 })
  tokenLookup!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  label!: string | null;

  @Column('uuid', { nullable: true })
  createdById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User | null;

  @CreateDateColumn()
  createdAt!: Date;
}
