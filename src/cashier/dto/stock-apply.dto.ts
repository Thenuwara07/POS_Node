import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockFromInvoicesLineDto {
  @ApiProperty({ example: 'BATCH-AMBUN-001' })
  @IsString()
  batch_id: string;

  @ApiProperty({ example: 3, description: 'item_id; 0 = quick sale / service' })
  @IsInt()
  @Min(0)
  item_id: number;

  @ApiProperty({ example: 2, description: 'Quantity to deduct from stock' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateStockFromInvoicesPayloadDto {
  @ApiProperty({
    type: UpdateStockFromInvoicesLineDto,
    isArray: true,
    description: 'Invoice lines for which stock must be deducted',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateStockFromInvoicesLineDto)
  invoices: UpdateStockFromInvoicesLineDto[];
}

export class StockApplyUpdatedDto {
  @ApiProperty({ example: 'BATCH-AMBUN-001' })
  batch_id: string;

  @ApiProperty({ example: 3 })
  item_id: number;

  @ApiProperty({ example: 2, description: 'Actually deducted from stock' })
  deducted: number;

  @ApiProperty({ example: 'item_id=0 Quick sale', required: false })
  @IsOptional()
  note?: string;
}

export class StockApplyWarnDto {
  @ApiProperty({ example: 'BATCH-COCA-001' })
  batch_id: string;

  @ApiProperty({ example: 5 })
  item_id: number;

  @ApiProperty({ example: 5 })
  requested: number;

  @ApiProperty({
    example: 2,
    nullable: true,
    description: 'Available quantity; null if invalid input',
  })
  @IsOptional()
  available: number | null;

  @ApiProperty({
    example: 'insufficient_stock',
    description: 'invalid_input | insufficient_stock',
  })
  reason: string;
}

export class StockApplyMissingDto {
  @ApiProperty({ example: 'BATCH-UNKNOWN-001' })
  batch_id: string;

  @ApiProperty({ example: 9 })
  item_id: number;

  @ApiProperty({ example: 3 })
  requested: number;

  @ApiProperty({ example: 'not_found' })
  reason: string;
}

export class StockApplyResultDto {
  @ApiProperty({ type: StockApplyUpdatedDto, isArray: true })
  updated: StockApplyUpdatedDto[];

  @ApiProperty({ type: StockApplyWarnDto, isArray: true })
  warnings: StockApplyWarnDto[];

  @ApiProperty({ type: StockApplyMissingDto, isArray: true })
  missing: StockApplyMissingDto[];
}
