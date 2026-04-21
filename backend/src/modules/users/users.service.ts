import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../../entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly audit: AuditService,
  ) {}

  private sanitize(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash: _omit, ...rest } = user;
    void _omit;
    return rest;
  }

  async list(actor: AuthenticatedUser): Promise<Omit<User, 'passwordHash'>[]> {
    const where =
      actor.role === Role.SUPER_ADMIN
        ? {}
        : { organizationId: actor.organizationId ?? undefined };
    const users = await this.userRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
    return users.map((u) => this.sanitize(u));
  }

  async findOne(actor: AuthenticatedUser, id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (
      actor.role !== Role.SUPER_ADMIN &&
      user.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException();
    }
    return this.sanitize(user);
  }

  async create(actor: AuthenticatedUser, dto: CreateUserDto) {
    if (actor.role === Role.ADMIN_OWNER) {
      if (dto.role === Role.SUPER_ADMIN || dto.role === Role.ADMIN_OWNER) {
        throw new ForbiddenException(
          'Admin owners cannot create super admins or other admin owners',
        );
      }
    }

    const organizationId =
      actor.role === Role.SUPER_ADMIN
        ? dto.organizationId ?? null
        : actor.organizationId;

    if (!organizationId && dto.role !== Role.SUPER_ADMIN) {
      throw new BadRequestException('organizationId is required');
    }

    const existing = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new BadRequestException('Email already used');

    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: dto.role,
      organizationId,
    });
    const saved = await this.userRepo.save(user);
    await this.audit.log(actor, 'create', 'User', saved.id, {
      email: saved.email,
      role: saved.role,
    });
    return this.sanitize(saved);
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (
      actor.role !== Role.SUPER_ADMIN &&
      user.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException();
    }
    if (
      actor.role === Role.ADMIN_OWNER &&
      dto.role &&
      (dto.role === Role.SUPER_ADMIN || dto.role === Role.ADMIN_OWNER)
    ) {
      throw new ForbiddenException('Cannot elevate to admin_owner/super_admin');
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    const saved = await this.userRepo.save(user);
    await this.audit.log(actor, 'update', 'User', id, {
      changedFields: Object.keys(dto),
    });
    return this.sanitize(saved);
  }

  async remove(actor: AuthenticatedUser, id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException();
    if (
      actor.role !== Role.SUPER_ADMIN &&
      user.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException();
    }
    await this.userRepo.remove(user);
    await this.audit.log(actor, 'delete', 'User', id);
    return { success: true };
  }
}
