import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../../entities/organization.entity';
import { UserInvite } from '../../entities/user-invite.entity';
import { User } from '../../entities/user.entity';
import { AuditModule } from '../audit/audit.module';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserInvite, User, Organization]),
    AuditModule,
  ],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
