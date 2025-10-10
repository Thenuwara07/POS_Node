// src/stock/dto/create-item-with-stock.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Dell Mouse' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '8901234567890' })
  @IsString()
  @IsNotEmpty()
  barcode!: string;

  @ApiProperty({ example: 1, description: 'Category ID' })
  @IsInt()
  @Min(1)
  categoryId!: number;

  @ApiProperty({ example: 3, description: 'Supplier ID' })
  @IsInt()
  @Min(1)
  supplierId!: number;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @ApiPropertyOptional({ example: 'linear(#0ea5e9,#22d3ee)' })
  @IsString()
  @IsOptional()
  gradient?: string;

  @ApiPropertyOptional({ example: 'Wireless mouse' })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ example: '#000000' })
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

  @ApiPropertyOptional({ example: 100 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ example: 450.0 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({ example: 650.0 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  sellPrice?: number;
}