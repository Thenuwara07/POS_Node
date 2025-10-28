// src/stock/dto/create-item-with-stock.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsHexColor,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateItemWithStockDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

   @ApiPropertyOptional({ example: '8901234567890' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  barcode?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  categoryId!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  supplierId!: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gradient?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional()
  @IsHexColor()
  @IsOptional()
  colorCode?: string;

  @ApiPropertyOptional({
    description: 'Base64 image data URL',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsString()
  @IsOptional()
  imageBase64?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  sellPrice?: number;
}