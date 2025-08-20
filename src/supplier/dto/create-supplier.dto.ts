// src/suppliers/dto/create-supplier.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsEmail,
  IsBoolean,
  IsHexColor,
  IsArray,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SupplierStatus } from '../../../generated/prisma'; // ✅ enums come from @prisma/client

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  contact!: string;

  @IsString()
  @IsNotEmpty()
  brand!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  // Optional in DTO because DB has a default "#000000"
  @IsHexColor()
  @IsOptional()
  colorCode?: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus;

  @IsBoolean()
  @IsOptional()
  preferred?: boolean; // DB defaults to false if omitted

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  /**
   * Optional: if you want to connect existing Location records.
   * Not part of the Prisma model fields directly, but useful for API shape.
   */
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  @IsOptional()
  locationIds?: number[];
}
