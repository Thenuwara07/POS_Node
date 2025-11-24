import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class InvoiceLineDto {
  @ApiProperty({ name: 'batch_id', example: 'BATCH001' })
  @Transform(({ value, obj }) => (value ?? obj?.batchId)?.toString())
  @IsString()
  batch_id!: string;

  @ApiProperty({ name: 'item_id', example: 1, description: 'Required. Must exist in item table.' })
  @Transform(({ value, obj }) => {
    const v = value ?? obj?.itemId;
    if (typeof v === 'number') return v;
    const parsed = Number.parseInt(String(v ?? ''), 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  })
  @IsInt()
  item_id!: number;

  @ApiProperty({ example: 2 })
  @Transform(({ value }) => {
    if (typeof value === 'number') return Math.trunc(value);
    const n = Number.parseInt(String(value ?? '0'), 10);
    return Number.isFinite(n) ? n : 0;
  })
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiProperty({ name: 'unit_saled_price', example: 120.0 })
  @Transform(({ value, obj }) => Number(value ?? obj?.unitSaledPrice))
  @IsNumber()
  unit_saled_price!: number;
}
