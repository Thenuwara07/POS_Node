// // src/suppliers/dto/create-supplier.dto.ts
// import {
//   IsString,
//   IsNotEmpty,
//   IsOptional,
//   IsEnum,
//   IsEmail,
//   IsBoolean,
//   IsHexColor,
//   IsArray,
//   IsInt,
// } from 'class-validator';
// import { SupplierStatus } from '../../../generated/prisma'; // ✅ enums come from @prisma/client

// // src/suppliers/dto/create-supplier.dto.ts
// export class CreateSupplierDto {
//   @IsString()
//   @IsNotEmpty()
//   name!: string;

//   @IsString()
//   @IsNotEmpty()
//   contact!: string;

//   @IsString()
//   @IsNotEmpty()
//   brand!: string;

//   @IsEmail()
//   @IsOptional()
//   email?: string;

//   @IsString()
//   @IsOptional()
//   address?: string;

//   @IsString()
//   @IsNotEmpty()
//   location!: string;

//   @IsEnum(SupplierStatus)
//   @IsOptional()
//   status?: SupplierStatus;

//   @IsBoolean()
//   @IsOptional()
//   preferred?: boolean; // Use boolean, Prisma will convert to number

//   @IsString()
//   @IsOptional()
//   paymentTerms?: string;

//   @IsString()
//   @IsOptional()
//   notes?: string;
// }


// src/suppliers/dto/create-supplier.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsEmail,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { SupplierStatus } from '../../../generated/prisma'; // ✅ Import from @prisma/client

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

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  preferred?: number; // Change from boolean to number

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  colorCode?: string;

  // Remove these as Prisma handles them automatically
  // createdAt?: Date;
  // updatedAt?: Date;
}