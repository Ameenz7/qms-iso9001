import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateShareDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;
}
