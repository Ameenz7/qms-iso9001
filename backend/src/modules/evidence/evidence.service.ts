import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evidence } from '../../entities/evidence.entity';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { EvidenceEntityType } from '../../common/enums/evidence-type.enum';

@Injectable()
export class EvidenceService {
  constructor(
    @InjectRepository(Evidence)
    private readonly repo: Repository<Evidence>,
  ) {}

  async create(
    actor: AuthenticatedUser,
    data: {
      entityId: string;
      entityType: EvidenceEntityType;
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number;
    },
  ) {
    if (!actor.organizationId) throw new BadRequestException('No organization');

    const evidence = this.repo.create({
      ...data,
      organizationId: actor.organizationId,
      uploadedById: actor.userId,
    });

    return this.repo.save(evidence);
  }

  async listForEntity(entityId: string, entityType: EvidenceEntityType) {
    return this.repo.find({
      where: { entityId, entityType },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const evidence = await this.repo.findOne({
      where: { id, organizationId: actor.organizationId! },
    });
    if (!evidence) throw new BadRequestException('Evidence not found');
    return evidence;
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const evidence = await this.repo.findOne({ where: { id, organizationId: actor.organizationId! } });
    if (!evidence) throw new BadRequestException('Evidence not found');
    await this.repo.remove(evidence);
    return { success: true };
  }
}
