import { IsString, IsEmail, IsOptional, IsNotEmpty, MinLength } from 'class-validator';

export class CreateManagerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  contact: string;

  @IsString()
  @IsNotEmpty()
  nic: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  role?: string; // Default: Manager

  @IsString()
  @IsOptional()
  colorCode?: string; // e.g. #RRGGBB

  @IsOptional()
  createdBy?: number;
}
