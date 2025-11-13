import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

function coalesce(...vals: any[]) {
  for (const v of vals) if (v !== undefined && v !== null) return v;
  return undefined;
}

export class CreateReturnDto {
  // Support snake_case + camelCase inputs (like Flutter)
  @ApiProperty({ example: 1 })
  @Transform(({ value, obj }) => coalesce(value, obj.userId))
  @IsInt()
  @Min(1, { message: 'user_id must be > 0' })
  user_id!: number;

  @ApiProperty({ example: 'BATCH-001' })
  @Transform(({ value, obj }) => coalesce(value, obj.batchId))
  @IsNotEmpty()
  batch_id!: string;

  @ApiProperty({ example: 10 })
  @Transform(({ value, obj }) => coalesce(value, obj.itemId))
  @IsInt()
  @Min(1, { message: 'item_id must be > 0' })
  item_id!: number;

  @ApiProperty({ example: 2 })
  @Transform(({ value, obj }) => coalesce(value, obj.qty))
  @IsInt()
  @Min(1, { message: 'quantity must be >= 1' })
  quantity!: number;

  @ApiProperty({ example: 550.0, description: 'unit_saled_price' })
  @Transform(({ value, obj }) => coalesce(value, obj.saled_unit_price, obj.saledUnitPrice))
  @IsNumber()
  @Min(0, { message: 'unit_saled_price must be >= 0' })
  unit_saled_price!: number;

  @ApiProperty({ example: 'INV-001' })
  @Transform(({ value, obj }) => coalesce(value, obj.salesInvoiceId))
  @IsNotEmpty()
  sale_invoice_id!: string;

  @ApiProperty({
    required: false,
    description: 'epoch ms (number) OR ISO string; defaults to now() if missing',
    example: 1731234567890,
  })
  @Transform(({ value, obj }) => coalesce(value, obj.createdAt, obj.date))
  @IsOptional()
  created_at?: number | string;
}
