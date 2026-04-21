import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  description?: string;

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
}
