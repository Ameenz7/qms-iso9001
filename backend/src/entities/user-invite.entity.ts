import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('user_invites')
export class UserInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 32 })
  role!: Role;

  @Column('uuid', { nullable: true })
  organizationId!: string | null;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization | null;

  // bcrypt hash of the plaintext token (plaintext only lives in the email)
  @Column({ type: 'varchar', length: 255 })
  tokenHash!: string;

  // first 12 chars of plaintext (non-secret) — lets us look up the right
  // row without scanning every row and bcrypt-comparing each one.
  @Index()
  @Column({ type: 'varchar', length: 32 })
  tokenLookup!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column('uuid', { nullable: true })
  invitedById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invitedById' })
  invitedBy!: User | null;

  @CreateDateColumn()
  createdAt!: Date;
}
