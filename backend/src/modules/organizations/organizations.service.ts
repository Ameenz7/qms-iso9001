import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.orgRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async create(actor: AuthenticatedUser, dto: CreateOrganizationDto) {
    const existing = await this.orgRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new BadRequestException('Organization name taken');

    const existingUser = await this.userRepo.findOne({
      where: { email: dto.ownerEmail.toLowerCase() },
    });
    if (existingUser) throw new BadRequestException('Owner email already used');

    return this.dataSource.transaction(async (trx) => {
      const org = trx.getRepository(Organization).create({
        name: dto.name,
        description: dto.description ?? null,
      });
      const savedOrg = await trx.getRepository(Organization).save(org);

      const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);
      const owner = trx.getRepository(User).create({
        email: dto.ownerEmail.toLowerCase(),
        passwordHash,
        firstName: dto.ownerFirstName,
        lastName: dto.ownerLastName,
        role: Role.ADMIN_OWNER,
        organizationId: savedOrg.id,
      });
      await trx.getRepository(User).save(owner);

      await this.audit.log(actor, 'create', 'Organization', savedOrg.id, {
        name: savedOrg.name,
        ownerEmail: owner.email,
      });

      return savedOrg;
    });
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateOrganizationDto,
  ) {
    const org = await this.findOne(id);
    Object.assign(org, dto);
    const saved = await this.orgRepo.save(org);
    await this.audit.log(actor, 'update', 'Organization', id, { ...dto });
    return saved;
  }

  async remove(actor: AuthenticatedUser, id: string) {
    const org = await this.findOne(id);
    await this.orgRepo.remove(org);
    await this.audit.log(actor, 'delete', 'Organization', id);
    return { success: true };
  }
}
