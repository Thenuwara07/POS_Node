import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { SupplierStatus } from '../../../generated/prisma';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  contact: string;

  @IsString()
  brand: string;

  @IsString()
  email: string;

  @IsString()
  address: string;

  @IsString()
  location: string;

  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus;
}
