import {
  IsArray, IsInt, IsNumber, IsOptional, IsPositive, IsString, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LookupItemQueryDto {
  @IsOptional() @IsInt() id?: number;
  @IsOptional() @IsString() barcode?: string;
}

export class RestockEntryDto {
  // Identify by either itemId or barcode (one must be present)
  @IsOptional() @IsInt() itemId?: number;
  @IsOptional() @IsString() barcode?: string;

  // Required data
  @IsInt() supplierId!: number;
  @IsInt() @IsPositive() quantity!: number;

  @IsNumber() @Min(0) unitPrice!: number;   // unit purchase price
  @IsNumber() @Min(0) sellPrice!: number;   // unit selling price

  @IsOptional() @IsNumber() @Min(0) discountAmount?: number; // per-unit discount (maps to Stock.discountAmount)
  @IsOptional() @IsString() batchId?: string;
  @IsOptional() @IsString() note?: string;
}

export class CreateRestockDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestockEntryDto)
  entries!: RestockEntryDto[];

  @IsOptional() recordSupplierTransaction?: boolean;
  @IsOptional() date?: Date;
}
