import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../../entities/organization.entity';
import { Payment } from '../../entities/payment.entity';
import { User } from '../../entities/user.entity';
import { BillingReconcilerService } from './billing-reconciler.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, Payment, User])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, BillingReconcilerService],
  exports: [OrganizationsService, TypeOrmModule],
})
export class OrganizationsModule {}
