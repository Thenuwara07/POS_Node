import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  barcode!: string;

  @IsString()
  @IsNotEmpty()
  unit!: string;

  @IsInt()
  categoryId!: number;

  @IsInt()
  supplierId!: number;

  @IsString()
  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: string;

  @IsNumber()
  @Min(0)
  cost!: number;

  @IsNumber()
  @Min(0)
  markup!: number;

  @IsNumber()
  @Min(0)
  salePrice!: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  reorderLevel?: number;

  @IsBoolean()
  @IsOptional()
  lowStockWarn?: boolean;

  @IsString()
  @IsOptional()
  gradient?: string | null;

  @IsString()
  @IsOptional()
  remark?: string | null;

  @IsString()
  @IsOptional()
  colorCode?: string;
}
