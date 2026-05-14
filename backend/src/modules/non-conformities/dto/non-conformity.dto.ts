import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { NCSeverity, NCStatus } from '../../../common/enums/status.enum';
import {
  CauseType,
  Likelihood,
  VerificationStatus,
} from '../../../entities/root-cause.entity';
import {
  ActionType,
  ActionPriority,
  ActionStatus,
} from '../../../entities/corrective-action.entity';

export class CreateNonConformityDto {
  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  description!: string;

  @IsOptional()
  area?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  detectionMethod?: string;

  @IsOptional()
  @IsEnum(NCSeverity)
  severity?: NCSeverity;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class UpdateNonConformityDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  area?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  detectionMethod?: string;

  @IsOptional()
  @IsEnum(NCSeverity)
  severity?: NCSeverity;

  @IsOptional()
  @IsEnum(NCStatus)
  status?: NCStatus;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class LinkCapaDto {
  @IsUUID()
  capaId!: string;
}

export class CreateRootCauseDto {
  @IsString()
  hypothesis!: string;

  @IsEnum(CauseType)
  causeType!: CauseType;

  @IsOptional()
  @IsString()
  verificationMethod?: string;

  @IsOptional()
  @IsEnum(Likelihood)
  likelihood?: Likelihood;
}

export class UpdateRootCauseDto {
  @IsOptional()
  @IsString()
  hypothesis?: string;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsEnum(Likelihood)
  likelihood?: Likelihood;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateCorrectiveActionDto {
  @IsString()
  description!: string;

  @IsEnum(ActionType)
  actionType!: ActionType;

  @IsOptional()
  @IsUUID()
  rootCauseId?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsEnum(ActionPriority)
  priority?: ActionPriority;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsBoolean()
  effectivenessCheckRequired?: boolean;
}

export class UpdateCorrectiveActionDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ActionStatus)
  status?: ActionStatus;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsEnum(ActionPriority)
  priority?: ActionPriority;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsBoolean()
  effectivenessVerified?: boolean;
}
