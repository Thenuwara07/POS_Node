// import {
//   IsBoolean,
//   IsIn,
//   IsInt,
//   IsNumber,
//   IsOptional,
//   IsString,
//   Min,
// } from 'class-validator';

// export class UpdateItemDto {
//   @IsString()
//   @IsOptional()
//   name?: string;

//   @IsString()
//   @IsOptional()
//   barcode?: string;

//   @IsString()
//   @IsOptional()
//   unit?: string;

//   @IsInt()
//   @IsOptional()
//   categoryId?: number;

//   @IsInt()
//   @IsOptional()
//   supplierId?: number;

//   @IsString()
//   @IsOptional()
//   @IsIn(['Active', 'Inactive'])
//   status?: string;

//   @IsNumber()
//   @IsOptional()
//   @Min(0)
//   cost?: number;

//   @IsNumber()
//   @IsOptional()
//   @Min(0)
//   markup?: number;

//   @IsNumber()
//   @IsOptional()
//   @Min(0)
//   salePrice?: number;

//   @IsInt()
//   @IsOptional()
//   @Min(0)
//   reorderLevel?: number;

//   @IsBoolean()
//   @IsOptional()
//   lowStockWarn?: boolean;

//   @IsString()
//   @IsOptional()
//   gradient?: string | null;

//   @IsString()
//   @IsOptional()
//   remark?: string | null;

//   @IsString()
//   @IsOptional()
//   colorCode?: string;
// }
