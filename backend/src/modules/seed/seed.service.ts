import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { User } from '../../entities/user.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const email =
      this.config.get<string>('SUPER_ADMIN_EMAIL') ?? 'admin@qms.local';
    const password =
      this.config.get<string>('SUPER_ADMIN_PASSWORD') ?? 'admin123';

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) return;

    const user = this.userRepo.create({
      email,
      passwordHash: await bcrypt.hash(password, 10),
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      organizationId: null,
    });
    await this.userRepo.save(user);
    this.logger.log(`Seeded super admin: ${email}`);
  }
}
