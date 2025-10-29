import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsHexColor, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateItemDto {
  @ApiPropertyOptional({ example: 'Fanta' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '8901234567890' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => value === '' || value === null ? undefined : Number(value))
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => value === '' || value === null ? undefined : Number(value))
  @IsInt()
  supplierId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => value === '' || value === null ? undefined : Number(value))
  @IsInt()
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional({ example: '#FF5733' })
  @IsOptional()
  @IsHexColor()
  colorCode?: string;

  @ApiPropertyOptional({ example: 'note about item' })
  @IsOptional()
  @IsString()
  remark?: string;

  // @ApiPropertyOptional({ type: 'string', format: 'binary' })
  // @IsOptional()
  // image?: any;

  @ApiPropertyOptional({ example: 'data:image/png;base64,iVBORw0K...' })
  @IsOptional()
  @IsString()
  imageBase64?: string;
}
