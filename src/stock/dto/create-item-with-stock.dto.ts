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
} from 'class-validator';

export class CreateItemWithStockDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: '8901234567890' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  barcode?: string;

  @ApiProperty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  categoryId!: number;

  @ApiProperty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  supplierId!: number;

  @ApiPropertyOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : parseInt(value, 10),
  )
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
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
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
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : parseInt(value, 10),
  )
  @IsInt()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : parseFloat(value),
  )
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : parseFloat(value),
  )
  @IsNumber()
  @Min(0)
  @IsOptional()
  sellPrice?: number;
}
