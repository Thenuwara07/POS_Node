import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateStockFromInvoicesLineDto {
  @ApiProperty({ example: 'BATCH-AMBUN-001' })
  @Transform(({ value, obj }) =>
    String(value ?? obj?.batchId ?? obj?.batch_id ?? '').trim(),
  )
  @IsString()
  batch_id: string;

  @ApiProperty({ example: 3, description: 'item_id; 0 = quick sale / service' })
  @Transform(({ value, obj }) => {
    const candidate =
      value ?? obj?.itemId ?? obj?.item_id ?? obj?.item ?? obj?.id ?? 0;
    const n =
      typeof candidate === 'number'
        ? candidate
        : Number.parseInt(String(candidate ?? '0'), 10);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  })
  @IsInt()
  @Min(0)
  item_id: number;

  @ApiProperty({ example: 2, description: 'Quantity to deduct from stock' })
  @Transform(({ value, obj }) => {
    const candidate =
      value ?? obj?.quantity ?? obj?.qty ?? obj?.amount ?? 0;
    const n =
      typeof candidate === 'number'
        ? candidate
        : Number.parseInt(String(candidate ?? '0'), 10);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  })
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
