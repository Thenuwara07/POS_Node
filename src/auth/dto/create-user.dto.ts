// src/auth/dto/create-user.dto.ts
import { IsString, IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '../../../generated/prisma-client';

export class CreateUserDto {
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  password: string;

  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(({ value }) =>
    String(value ?? '')
      .replace(/[^\d+]/g, '')
      .trim(),
  )
  @IsString()
  @IsNotEmpty()
  contact: string;

  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  nic: string;

  @Transform(({ value }) => {
    const v = String(value ?? '').trim().toUpperCase();
    return v as Role;
  })
  @IsEnum(Role) // must be ADMIN | MANAGER | CASHIER | STOCKKEEPER
  role: Role;

  // Remove these as Prisma handles them automatically
  // createdAt?: Date;
  // updatedAt?: Date;
}
