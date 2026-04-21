import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { NCStatus } from '../../common/enums/status.enum';
import { Capa } from '../../entities/capa.entity';
import { NonConformity } from '../../entities/non-conformity.entity';
import { AuditService } from '../audit/audit.service';
import {
  CreateNonConformityDto,
  LinkCapaDto,
  UpdateNonConformityDto,
} from './dto/non-conformity.dto';

@Injectable()
export class NonConformitiesService {
  constructor(
    @InjectRepository(NonConformity)
    private readonly ncRepo: Repository<NonConformity>,
    @InjectRepository(Capa) private readonly capaRepo: Repository<Capa>,
    private readonly audit: AuditService,
  ) {}

  async list(actor: AuthenticatedUser) {
    if (!actor.organizationId) {
      throw new BadRequestException('User has no organization');
    }
    const qb = this.ncRepo
      .createQueryBuilder('nc')
      .leftJoinAndSelect('nc.submittedBy', 'submittedBy')
      .leftJoinAndSelect('nc.capa', 'capa')
      .where('nc.organizationId = :orgId', { orgId: actor.organizationId })
      .orderBy('nc.createdAt', 'DESC');

    if (actor.role === Role.EMPLOYEE) {
      qb.andWhere('nc.submittedById = :uid', { uid: actor.userId });
    }
    return qb.getMany();
  }

  async findOne(actor: AuthenticatedUser, id: string) {
    const nc = await this.ncRepo.findOne({
      where: { id },
      relations: ['submittedBy', 'capa'],
    });
    if (!nc) throw new NotFoundException();
    if (nc.organizationId !== actor.organizationId) {
      throw new ForbiddenException();
    }
    if (
      actor.role === Role.EMPLOYEE &&
      nc.submittedById !== actor.userId
    ) {
      throw new ForbiddenException();
    }
    return nc;
  }

  async create(actor: AuthenticatedUser, dto: CreateNonConformityDto) {
    if (!actor.organizationId) {
      throw new BadRequestException('User has no organization');
    }
    const nc = this.ncRepo.create({
      ...dto,
      submittedById: actor.userId,
      organizationId: actor.organizationId,
    });
    const saved = await this.ncRepo.save(nc);
    await this.audit.log(actor, 'create', 'NonConformity', saved.id, {
      title: saved.title,
    });
    return saved;
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateNonConformityDto,
  ) {
    const nc = await this.findOne(actor, id);
    if (actor.role === Role.EMPLOYEE) {
      throw new ForbiddenException();
    }
    Object.assign(nc, dto);
    const saved = await this.ncRepo.save(nc);
    await this.audit.log(actor, 'update', 'NonConformity', id, { ...dto });
    return saved;
  }

  async linkToCapa(actor: AuthenticatedUser, id: string, dto: LinkCapaDto) {
    const nc = await this.findOne(actor, id);
    const capa = await this.capaRepo.findOne({ where: { id: dto.capaId } });
    if (!capa) throw new NotFoundException('CAPA not found');
    if (capa.organizationId !== nc.organizationId) {
      throw new ForbiddenException();
    }
    nc.capaId = capa.id;
    nc.status = NCStatus.LINKED;
    const saved = await this.ncRepo.save(nc);
    await this.audit.log(actor, 'link_capa', 'NonConformity', id, {
      capaId: capa.id,
      capaCode: capa.code,
    });
    return saved;
  }

  async remove(actor: AuthenticatedUser, id: string) {
    const nc = await this.findOne(actor, id);
    if (
      actor.role === Role.EMPLOYEE &&
      (nc.submittedById !== actor.userId || nc.status !== NCStatus.SUBMITTED)
    ) {
      throw new ForbiddenException();
    }
    await this.ncRepo.remove(nc);
    await this.audit.log(actor, 'delete', 'NonConformity', id);
    return { success: true };
  }
}
