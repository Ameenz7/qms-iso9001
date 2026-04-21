import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { DocumentStatus } from '../../../common/enums/status.enum';

export class CreateDocumentDto {
  @IsNotEmpty()
  code!: string;

  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  content!: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  content?: string;

  @IsOptional()
  changeNote?: string;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}
