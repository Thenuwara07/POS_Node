// src/auth/dto/create-user.dto.ts
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';
import { IsEnum } from 'class-validator';
import {Role} from '../../../generated/prisma'; // Adjust the import path as necessary

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

  @IsEnum(Role, { message: 'Role must be one of: ADMIN, CASHIER, STOCKKEEPER' })
  @IsNotEmpty()
  role: Role;  // // Role can be 'Cashier', 'StockKeeper', 'Manager', 'Admin'
}
