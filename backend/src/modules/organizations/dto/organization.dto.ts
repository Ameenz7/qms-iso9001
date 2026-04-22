import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  plan?: string;

  @IsOptional()
  @IsNumberString()
  monthlyPrice?: string;

  @IsEmail()
  ownerEmail!: string;

  @IsNotEmpty()
  ownerFirstName!: string;

  @IsNotEmpty()
  ownerLastName!: string;

  @MinLength(6)
  ownerPassword!: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  plan?: string;

  @IsOptional()
  @IsNumberString()
  monthlyPrice?: string;
}

export class SuspendOrganizationDto {
  @IsOptional()
  reason?: string;
}

export class RecordPaymentDto {
  @IsNumberString()
  amount!: string;

  @IsInt()
  @Min(1)
  @Max(60)
  monthsCovered!: number;

  @IsOptional()
  note?: string;
}
