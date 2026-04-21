import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { CAPAStatus } from '../../../common/enums/status.enum';

export class CreateCapaDto {
  @IsNotEmpty()
  code!: string;

  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  description!: string;

  @IsOptional()
  rootCause?: string;

  @IsOptional()
  correctiveAction?: string;

  @IsOptional()
  preventiveAction?: string;

  @IsOptional()
  verification?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class UpdateCapaDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  rootCause?: string;

  @IsOptional()
  correctiveAction?: string;

  @IsOptional()
  preventiveAction?: string;

  @IsOptional()
  verification?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(CAPAStatus)
  status?: CAPAStatus;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
