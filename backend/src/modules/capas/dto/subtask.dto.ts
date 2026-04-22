import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CapaSubtaskStatus } from '../../../common/enums/status.enum';

export class CreateSubtaskDto {
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateSubtaskDto {
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CapaSubtaskStatus)
  status?: CapaSubtaskStatus;

  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}

export class UpdateFiveWhysDto {
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  fiveWhys!: string[];

  @IsOptional()
  @IsString()
  rootCause?: string;
}

export class PromoteNcDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  code?: string;
}
