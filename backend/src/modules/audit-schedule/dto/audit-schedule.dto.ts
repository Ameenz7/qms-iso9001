import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AuditType,
  AuditFrequency,
  AuditStatus,
} from '../../../entities/audit-schedule.entity';
import { FindingType } from '../../../entities/audit-checklist-item.entity';
import { FindingSeverity } from '../../../entities/audit-finding.entity';

export class CreateChecklistItemDto {
  @IsInt()
  itemNumber!: number;

  @IsString()
  requirement!: string;

  @IsOptional()
  @IsBoolean()
  evidenceRequired?: boolean;
}

export class CreateAuditScheduleDto {
  @IsEnum(AuditType)
  type!: AuditType;

  @IsString()
  title!: string;

  @IsOptional()
  @IsEnum(AuditFrequency)
  frequency?: AuditFrequency;

  @IsDateString()
  plannedDate!: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsUUID()
  auditorId?: string;

  @IsOptional()
  @IsUUID()
  auditeeId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistItemDto)
  checklistItems?: CreateChecklistItemDto[];
}

export class UpdateAuditScheduleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(AuditStatus)
  status?: AuditStatus;

  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsUUID()
  auditorId?: string;

  @IsOptional()
  @IsUUID()
  auditeeId?: string;
}

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsEnum(FindingType)
  findingType?: FindingType;

  @IsOptional()
  @IsString()
  findingDescription?: string;

  @IsOptional()
  @IsBoolean()
  correctiveActionRequired?: boolean;
}

export class CreateFindingDto {
  @IsString()
  description!: string;

  @IsEnum(FindingSeverity)
  severity!: FindingSeverity;

  @IsOptional()
  @IsString()
  category?: string;
}
