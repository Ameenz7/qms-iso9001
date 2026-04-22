import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { Organization } from '../../entities/organization.entity';
import { UserInvite } from '../../entities/user-invite.entity';
import { User } from '../../entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { MailerService } from '../mailer/mailer.service';
import { AcceptInviteDto, CreateInviteDto } from './dto/invite.dto';

const INVITE_TTL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(UserInvite)
    private readonly inviteRepo: Repository<UserInvite>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    private readonly audit: AuditService,
    private readonly mailer: MailerService,
    private readonly dataSource: DataSource,
  ) {}

  private appUrl(): string {
    return process.env.APP_URL ?? 'http://localhost:4200';
  }

  private generateToken(): { plain: string; lookup: string; hash: string } {
    // 32 bytes → 43-char base64url, plenty of entropy.
    const plain = crypto.randomBytes(32).toString('base64url');
    const lookup = plain.slice(0, 12);
    const hash = bcrypt.hashSync(plain, 10);
    return { plain, lookup, hash };
  }

  async create(
    actor: AuthenticatedUser,
    dto: CreateInviteDto,
  ): Promise<{ invite: UserInvite; acceptUrl: string }> {
    if (actor.role === Role.ADMIN_OWNER) {
      if (dto.role === Role.SUPER_ADMIN || dto.role === Role.ADMIN_OWNER) {
        throw new ForbiddenException(
          'Admin owners cannot invite super admins or other admin owners',
        );
      }
    }

    const organizationId =
      actor.role === Role.SUPER_ADMIN
        ? (dto.organizationId ?? null)
        : actor.organizationId;

    if (!organizationId && dto.role !== Role.SUPER_ADMIN) {
      throw new BadRequestException('organizationId is required');
    }

    const email = dto.email.toLowerCase();

    // Refuse if an active user with this email already exists.
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    // Revoke any prior pending invite for the same email.
    await this.inviteRepo.update(
      {
        email,
        acceptedAt: null as unknown as Date,
        revokedAt: null as unknown as Date,
      },
      { revokedAt: new Date() },
    );

    const { plain, lookup, hash } = this.generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITE_TTL_DAYS * MS_PER_DAY);

    const invite = this.inviteRepo.create({
      email,
      role: dto.role,
      organizationId,
      tokenHash: hash,
      tokenLookup: lookup,
      expiresAt,
      invitedById: actor.userId,
    });
    const saved = await this.inviteRepo.save(invite);

    const acceptUrl = `${this.appUrl()}/accept-invite?token=${encodeURIComponent(plain)}`;

    let orgName = '';
    if (organizationId) {
      const org = await this.orgRepo.findOne({ where: { id: organizationId } });
      orgName = org?.name ?? '';
    }

    await this.mailer
      .send({
        to: email,
        subject: `You're invited to join ${orgName || 'the QMS'}`,
        html: this.renderInviteHtml({
          orgName,
          role: dto.role,
          acceptUrl,
          expiresAt,
        }),
        text: `You've been invited${orgName ? ' to ' + orgName : ''} as ${dto.role}.\nAccept: ${acceptUrl}\nExpires: ${expiresAt.toISOString()}`,
      })
      .catch((err: Error) => {
        // Don't fail the invite creation if email send fails — the admin still
        // has the copyable link in the response.
        return { error: err.message };
      });

    await this.audit.log(actor, 'create', 'UserInvite', saved.id, {
      email,
      role: dto.role,
    });

    return { invite: saved, acceptUrl };
  }

  async list(actor: AuthenticatedUser): Promise<UserInvite[]> {
    const qb = this.inviteRepo
      .createQueryBuilder('i')
      .orderBy('i.createdAt', 'DESC');
    if (actor.role !== Role.SUPER_ADMIN) {
      qb.andWhere('i.organizationId = :orgId', {
        orgId: actor.organizationId,
      });
    }
    return qb.getMany();
  }

  async revoke(actor: AuthenticatedUser, id: string) {
    const invite = await this.inviteRepo.findOne({ where: { id } });
    if (!invite) throw new NotFoundException();
    if (
      actor.role !== Role.SUPER_ADMIN &&
      invite.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException();
    }
    if (invite.acceptedAt) {
      throw new BadRequestException('Invite already accepted');
    }
    invite.revokedAt = new Date();
    const saved = await this.inviteRepo.save(invite);
    await this.audit.log(actor, 'revoke', 'UserInvite', id);
    return saved;
  }

  private async findByToken(token: string): Promise<UserInvite | null> {
    if (!token || token.length < 12) return null;
    const lookup = token.slice(0, 12);
    const candidates = await this.inviteRepo.find({
      where: { tokenLookup: lookup },
    });
    for (const c of candidates) {
      if (await bcrypt.compare(token, c.tokenHash)) return c;
    }
    return null;
  }

  async verify(token: string) {
    const invite = await this.findByToken(token);
    if (!invite) throw new NotFoundException('Invalid invite');
    if (invite.acceptedAt)
      throw new BadRequestException('This invite has already been used');
    if (invite.revokedAt) throw new BadRequestException('Invite revoked');
    if (invite.expiresAt.getTime() < Date.now())
      throw new BadRequestException('Invite expired');

    let orgName: string | null = null;
    if (invite.organizationId) {
      const org = await this.orgRepo.findOne({
        where: { id: invite.organizationId },
      });
      orgName = org?.name ?? null;
    }
    return {
      email: invite.email,
      role: invite.role,
      organizationName: orgName,
      expiresAt: invite.expiresAt,
    };
  }

  async accept(dto: AcceptInviteDto) {
    const invite = await this.findByToken(dto.token);
    if (!invite) throw new NotFoundException('Invalid invite');
    if (invite.acceptedAt)
      throw new BadRequestException('This invite has already been used');
    if (invite.revokedAt) throw new BadRequestException('Invite revoked');
    if (invite.expiresAt.getTime() < Date.now())
      throw new BadRequestException('Invite expired');

    const existing = await this.userRepo.findOne({
      where: { email: invite.email },
    });
    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    return this.dataSource.transaction(async (trx) => {
      const user = trx.getRepository(User).create({
        email: invite.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: invite.role,
        organizationId: invite.organizationId,
      });
      const savedUser = await trx.getRepository(User).save(user);

      invite.acceptedAt = new Date();
      await trx.getRepository(UserInvite).save(invite);

      // Audit log with the new user as actor context.
      await this.audit.log(
        {
          userId: savedUser.id,
          role: savedUser.role,
          organizationId: savedUser.organizationId,
          email: savedUser.email,
        },
        'accept-invite',
        'User',
        savedUser.id,
      );

      return { id: savedUser.id, email: savedUser.email };
    });
  }

  private renderInviteHtml(opts: {
    orgName: string;
    role: Role;
    acceptUrl: string;
    expiresAt: Date;
  }): string {
    const { orgName, role, acceptUrl, expiresAt } = opts;
    const roleLabel = role.replace(/_/g, ' ');
    return `
<!doctype html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif; background:#f8fafc; margin:0; padding:32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:8px;">
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 16px; font-size:20px;">You're invited to ${orgName ? `<strong>${orgName}</strong>` : 'the QMS'}</h1>
        <p style="margin:0 0 12px; color:#334155;">You've been invited to join as <strong>${roleLabel}</strong>. Click the button below to set your password and activate your account.</p>
        <p style="margin:24px 0;">
          <a href="${acceptUrl}" style="background:#0f172a; color:#fff; padding:10px 18px; text-decoration:none; border-radius:6px; display:inline-block;">Accept invitation</a>
        </p>
        <p style="margin:0; color:#64748b; font-size:13px;">This link expires on ${expiresAt.toUTCString()}. If you didn't expect this email, you can ignore it.</p>
        <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;">
        <p style="margin:0; color:#94a3b8; font-size:12px; word-break:break-all;">Button not working? Paste this URL into your browser: ${acceptUrl}</p>
      </td></tr>
    </table>
  </body>
</html>`;
  }
}
