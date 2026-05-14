import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    private readonly auditService: AuditService,
  ) {}

  async getAccount(user: AuthenticatedUser) {
    const u = await this.userRepo.findOne({
      where: { id: user.userId },
      relations: ['organization'],
    });
    if (!u) throw new NotFoundException('User not found');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _hash, ...profile } = u;
    return profile;
  }

  async updateAccount(
    user: AuthenticatedUser,
    dto: { firstName?: string; lastName?: string },
  ) {
    const u = await this.userRepo.findOneBy({ id: user.userId });
    if (!u) throw new NotFoundException('User not found');
    if (dto.firstName) u.firstName = dto.firstName;
    if (dto.lastName) u.lastName = dto.lastName;
    await this.userRepo.save(u);
    await this.auditService.log(user, 'UPDATE', 'User', user.userId, {
      fields: Object.keys(dto),
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _hash2, ...profile } = u;
    return profile;
  }

  async changePassword(
    user: AuthenticatedUser,
    dto: { currentPassword: string; newPassword: string },
  ) {
    const u = await this.userRepo.findOneBy({ id: user.userId });
    if (!u) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(dto.currentPassword, u.passwordHash);
    if (!valid) throw new ForbiddenException('Current password is incorrect');
    u.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.save(u);
    await this.auditService.log(user, 'UPDATE', 'User', user.userId, {
      fields: ['password'],
    });
    return { message: 'Password changed successfully' };
  }

  async getOrgSettings(user: AuthenticatedUser) {
    if (!user.organizationId) throw new ForbiddenException('No organization');
    return this.orgRepo.findOneBy({ id: user.organizationId });
  }

  async updateOrgSettings(
    user: AuthenticatedUser,
    dto: { name?: string; description?: string },
  ) {
    if (!user.organizationId) throw new ForbiddenException('No organization');
    if (user.role !== Role.ADMIN_OWNER && user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only Admin can update org settings');
    }
    const org = await this.orgRepo.findOneBy({ id: user.organizationId });
    if (!org) throw new NotFoundException('Organization not found');
    if (dto.name) org.name = dto.name;
    if (dto.description !== undefined) org.description = dto.description;
    await this.orgRepo.save(org);
    await this.auditService.log(user, 'UPDATE', 'Organization', org.id, {
      fields: Object.keys(dto),
    });
    return org;
  }

  async getOrgUsers(user: AuthenticatedUser) {
    if (!user.organizationId) throw new ForbiddenException('No organization');
    return this.userRepo.find({
      where: { organizationId: user.organizationId },
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async updateUserRole(
    user: AuthenticatedUser,
    userId: string,
    dto: { role: Role },
  ) {
    if (!user.organizationId) throw new ForbiddenException('No organization');
    const target = await this.userRepo.findOneBy({
      id: userId,
      organizationId: user.organizationId,
    });
    if (!target) throw new NotFoundException('User not found in organization');
    if (target.id === user.userId) {
      throw new ForbiddenException('Cannot change your own role');
    }
    const oldRole = target.role;
    target.role = dto.role;
    await this.userRepo.save(target);
    await this.auditService.log(user, 'UPDATE', 'User', userId, {
      oldRole,
      newRole: dto.role,
    });
    return target;
  }

  async suspendUser(user: AuthenticatedUser, userId: string) {
    if (!user.organizationId) throw new ForbiddenException('No organization');
    const target = await this.userRepo.findOneBy({
      id: userId,
      organizationId: user.organizationId,
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === user.userId) {
      throw new ForbiddenException('Cannot suspend yourself');
    }
    target.isActive = false;
    await this.userRepo.save(target);
    await this.auditService.log(user, 'UPDATE', 'User', userId, {
      action: 'suspend',
    });
    return target;
  }

  async reactivateUser(user: AuthenticatedUser, userId: string) {
    if (!user.organizationId) throw new ForbiddenException('No organization');
    const target = await this.userRepo.findOneBy({
      id: userId,
      organizationId: user.organizationId,
    });
    if (!target) throw new NotFoundException('User not found');
    target.isActive = true;
    await this.userRepo.save(target);
    await this.auditService.log(user, 'UPDATE', 'User', userId, {
      action: 'reactivate',
    });
    return target;
  }
}
