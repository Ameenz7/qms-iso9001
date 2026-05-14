import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditSchedule } from '../../entities/audit-schedule.entity';
import { AuditChecklistItem } from '../../entities/audit-checklist-item.entity';
import { AuditFinding } from '../../entities/audit-finding.entity';
import { AuditScheduleService } from './audit-schedule.service';
import { AuditScheduleController } from './audit-schedule.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditSchedule, AuditChecklistItem, AuditFinding]),
  ],
  providers: [AuditScheduleService],
  controllers: [AuditScheduleController],
  exports: [AuditScheduleService],
})
export class AuditScheduleModule {}
