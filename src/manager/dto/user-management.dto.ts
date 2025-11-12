// src/manager/dto/update-user-credentials.dto.ts
import { IsEmail, IsInt, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class UpdateUserCredentialsDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  newName?: string;

  @IsOptional()
  @IsEmail()
  newEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  newPassword?: string;
}
