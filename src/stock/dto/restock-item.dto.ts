import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class RestockItemDto {

  @ApiProperty()
  @IsInt()
  supplierId!: number;

  @ApiProperty({ example: 25, description: 'Quantity to add (must be >= 1)' })
  @IsInt()
  @Min(1)
  qty!: number;

  @ApiPropertyOptional({ example: 450.0, description: 'New unit cost (optional)' })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @ApiPropertyOptional({ example: 650.0, description: 'New selling price (optional)' })
  @IsOptional()
  @IsNumber()
  sellPrice?: number;
}