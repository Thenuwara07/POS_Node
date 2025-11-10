// src/auth/dto/create-user.dto.ts
import { IsString, IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { Role } from '../../../generated/prisma';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  contact: string;

 @IsEnum(Role) // This should match your Prisma schema
  role: Role;

  // Remove these as Prisma handles them automatically
  // createdAt?: Date;
  // updatedAt?: Date;
}
