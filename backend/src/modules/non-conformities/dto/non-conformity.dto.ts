import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { NCSeverity, NCStatus } from '../../../common/enums/status.enum';

export class CreateNonConformityDto {
  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  description!: string;

  @IsOptional()
  area?: string;

  @IsOptional()
  @IsEnum(NCSeverity)
  severity?: NCSeverity;
}

export class UpdateNonConformityDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  area?: string;

  @IsOptional()
  @IsEnum(NCSeverity)
  severity?: NCSeverity;

  @IsOptional()
  @IsEnum(NCStatus)
  status?: NCStatus;
}

export class LinkCapaDto {
  @IsUUID()
  capaId!: string;
}
