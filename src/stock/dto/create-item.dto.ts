import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsHexColor,
} from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  barcode!: string;

  @IsInt()
  @Min(1)
  categoryId!: number;

  @IsInt()
  @Min(1)
  supplierId!: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  reorderLevel?: number; // defaults to 0 in DB if omitted

  @IsString()
  @IsOptional()
  gradient?: string | null; // HEX string or JSON per your comment

  @IsString()
  @IsOptional()
  remark?: string | null;

  @IsHexColor()
  @IsOptional()
  colorCode?: string; // defaults to "#000000" in DB if omitted
}
