import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NonConformity } from '../../entities/non-conformity.entity';
import { QmsDocument } from '../../entities/document.entity';
import { AuditSchedule } from '../../entities/audit-schedule.entity';
import { CorrectiveAction } from '../../entities/corrective-action.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NonConformity,
      QmsDocument,
      AuditSchedule,
      CorrectiveAction,
    ]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
