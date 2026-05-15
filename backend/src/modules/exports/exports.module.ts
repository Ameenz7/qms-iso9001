import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NonConformity } from '../../entities/non-conformity.entity';
import { QmsDocument } from '../../entities/document.entity';
import { AuditSchedule } from '../../entities/audit-schedule.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NonConformity,
      QmsDocument,
      AuditSchedule,
      AuditLog,
    ]),
  ],
  providers: [ExportsService],
  controllers: [ExportsController],
})
export class ExportsModule {}
