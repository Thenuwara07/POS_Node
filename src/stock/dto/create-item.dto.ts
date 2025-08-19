// src/stock/dto/create-item.dto.ts
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateItemDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsNotEmpty()
  barcode: string;

  @IsString() @IsNotEmpty()
  unit: string;

  @IsString() @IsNotEmpty()
  category: string;

  @IsString() @IsOptional() @IsIn(['Active', 'Inactive'])
  status?: string; // default = "Active" in DB

  @IsNumber() @Min(0)
  cost: number;

  @IsNumber()
  markup: number;

  @IsNumber() @Min(0)
  salePrice: number;

  @IsInt() @Min(1)
  supplierId: number;

  @IsInt() @IsOptional() @Min(0)
  reorderLevel?: number; // default 0

  @IsBoolean() @IsOptional()
  lowStockWarn?: boolean; // default true

  @IsString() @IsOptional()
  gradient?: string | null;

  @IsString() @IsOptional()
  remark?: string | null;

  @IsString() @IsOptional()
  colorCode?: string; // default "#000000"
}
