import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

const toEpochMs = (v: any): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    if (!Number.isNaN(n) && n > 10_000_000_000) return n; // already ms
    const ts = Date.parse(v);
    if (!Number.isNaN(ts)) return ts;
  }
  return Date.now();
};

const normType = (v: unknown): 'Cash' | 'Card' =>
  String(v ?? '').toLowerCase() === 'card' ? 'Card' : 'Cash';

const normDiscount = (v: unknown): 'no' | 'percentage' | 'amount' => {
  const s = String(v ?? '').toLowerCase();
  if (s === 'percentage') return 'percentage';
  if (s === 'amount') return 'amount';
  return 'no';
};

export class CreatePaymentDto {
  @ApiProperty({ example: 1500.0 })
  @Transform(({ value }) => Number(value))
  @IsNumber() @Min(0)
  amount!: number;

  @ApiProperty({ name: 'remain_amount', example: 500.0 })
  @Transform(({ value, obj }) => Number(value ?? obj?.remainAmount))
  @IsNumber() @Min(0)
  remain_amount!: number;

  @ApiProperty({ example: 1730563200000, description: 'epoch ms or ISO string' })
  @Transform(({ value }) => toEpochMs(value))
  @IsNumber()
  date!: number;

  @ApiProperty({ name: 'file_name', example: 'receipt1.pdf' })
  @Transform(({ value, obj }) => value ?? obj?.fileName ?? null)
  @IsString()
  file_name!: string;

  @ApiProperty({ example: 'Cash', description: 'Cash | Card' })
  @Transform(({ value }) => normType(value))
  @IsString() @IsIn(['Cash', 'Card'])
  type!: 'Cash' | 'Card';

  @ApiProperty({ name: 'sale_invoice_id', example: 'INV-001' })
  @Transform(({ value, obj }) => (value ?? obj?.salesInvoiceId ?? '').toString())
  @IsString()
  sale_invoice_id!: string;

  @ApiPropertyOptional({ name: 'user_id', example: 1, nullable: true })
  @Transform(({ value, obj }) => value ?? obj?.userId ?? null)
  @IsOptional() @IsInt()
  user_id?: number | null;

  @ApiPropertyOptional({ name: 'customer_contact', example: '0771234567', nullable: true })
  @Transform(({ value, obj }) => value ?? obj?.customerContact ?? null)
  @IsOptional() @IsString()
  customer_contact?: string | null;

  @ApiProperty({ name: 'discount_type', example: 'no', description: 'no | percentage | amount' })
  @Transform(({ value }) => normDiscount(value))
  @IsString() @IsIn(['no', 'percentage', 'amount'])
  discount_type!: 'no' | 'percentage' | 'amount';

  @ApiProperty({ name: 'discount_value', example: 0.0 })
  @Transform(({ value }) => (value == null ? 0 : Number(value)))
  @IsNumber() @Min(0)
  discount_value!: number;
}
