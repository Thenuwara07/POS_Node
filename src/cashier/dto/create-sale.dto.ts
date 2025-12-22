import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { InvoiceLineDto } from './invoice-line.dto';

const toEpochMs = (v: any): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    if (!Number.isNaN(n) && n > 10_000_000_000) return n;
    const ts = Date.parse(v);
    if (!Number.isNaN(ts)) return ts;
  }
  return Date.now();
};

const normType = (v: unknown): 'Cash' | 'Card' | 'Split' => {
  const s = String(v ?? '').toLowerCase();
  if (s === 'card') return 'Card';
  if (s === 'split') return 'Split';
  return 'Cash';
};

const normDiscount = (v: unknown): 'no' | 'percentage' | 'amount' => {
  const s = String(v ?? '').toLowerCase();
  if (s === 'percentage') return 'percentage';
  if (s === 'amount') return 'amount';
  return 'no';
};

export class CreateSaleDto {
  @ApiProperty({ type: [InvoiceLineDto] })
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  @IsArray()
  invoices!: InvoiceLineDto[];

  @ApiPropertyOptional({
    example: 'Cash',
    enum: ['Cash', 'Card', 'Split'],
    description: 'Payment method',
  })
  @Transform(({ value }) => normType(value))
  @IsString()
  @IsIn(['Cash', 'Card', 'Split'])
  type: 'Cash' | 'Card' | 'Split' = 'Cash';

  @ApiPropertyOptional({ name: 'cash_amount', example: 500.0 })
  @Transform(({ value }) =>
    value == null ? undefined : Number(value),
  )
  @IsOptional()
  @IsNumber()
  @Min(0)
  cash_amount?: number;

  @ApiPropertyOptional({ name: 'card_amount', example: 500.0 })
  @Transform(({ value }) =>
    value == null ? undefined : Number(value),
  )
  @IsOptional()
  @IsNumber()
  @Min(0)
  card_amount?: number;

  @ApiPropertyOptional({
    name: 'sale_invoice_id',
    example: 'INV-001',
    description: 'Optional; auto-generated when empty',
  })
  @Transform(({ value, obj }) => {
    const v = value ?? obj?.saleInvoiceId;
    return v == null ? undefined : v.toString();
  })
  @IsOptional()
  @IsString()
  sale_invoice_id?: string;

  @ApiPropertyOptional({ name: 'user_id', example: 1, nullable: true })
  @Transform(({ value, obj }) => value ?? obj?.userId ?? null)
  @IsOptional()
  @IsInt()
  user_id?: number | null;

  @ApiPropertyOptional({
    name: 'customer_contact',
    example: '0771234567',
    nullable: true,
  })
  @Transform(({ value, obj }) => value ?? obj?.customerContact ?? null)
  @IsOptional()
  @IsString()
  customer_contact?: string | null;

  @ApiPropertyOptional({
    name: 'file_name',
    example: 'sale-123',
    description: 'Optional receipt/file label',
  })
  @Transform(({ value, obj }) => value ?? obj?.fileName ?? undefined)
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiPropertyOptional({
    name: 'discount_type',
    example: 'no',
    enum: ['no', 'percentage', 'amount'],
  })
  @Transform(({ value }) => normDiscount(value))
  @IsString()
  @IsIn(['no', 'percentage', 'amount'])
  discount_type: 'no' | 'percentage' | 'amount' = 'no';

  @ApiPropertyOptional({ name: 'discount_value', example: 0 })
  @Transform(({ value }) => (value == null ? 0 : Number(value)))
  @IsNumber()
  @Min(0)
  discount_value: number = 0;

  @ApiPropertyOptional({
    name: 'remain_amount',
    example: 0,
    description: 'Outstanding amount; capped to total',
  })
  @Transform(({ value }) => (value == null ? 0 : Number(value)))
  @IsNumber()
  @Min(0)
  remain_amount: number = 0;

  @ApiPropertyOptional({
    example: 1730563200000,
    description: 'epoch ms or ISO string; defaults to now',
  })
  @Transform(({ value }) => toEpochMs(value))
  @IsNumber()
  date?: number;
}
