import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsUUID()
  organizationId?: string;
}

export class AcceptInviteDto {
  @IsNotEmpty()
  token!: string;

  @IsNotEmpty()
  firstName!: string;

  @IsNotEmpty()
  lastName!: string;

  @MinLength(6)
  password!: string;
}
