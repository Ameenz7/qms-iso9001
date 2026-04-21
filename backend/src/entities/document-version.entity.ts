import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QmsDocument } from './document.entity';
import { User } from './user.entity';

@Entity('document_versions')
export class DocumentVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => QmsDocument, (d) => d.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document!: QmsDocument;

  @Column({ type: 'uuid' })
  documentId!: string;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ nullable: true, type: 'text' })
  changeNote!: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @Column({ type: 'uuid' })
  createdById!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
