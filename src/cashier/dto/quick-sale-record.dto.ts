import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentRecordDto } from './payment-record.dto';

export class QuickSaleRecordDto {
  @ApiProperty() id!: number;

  @ApiProperty({ name: 'sale_invoice_id' })
  sale_invoice_id!: string;

  @ApiProperty() name!: string;

  @ApiProperty() quantity!: number;

  @ApiProperty({ name: 'unit_cost' }) unit_cost!: number;

  @ApiProperty({ name: 'unit_price' }) unit_price!: number;

  @ApiProperty({ description: 'Computed line total = unit_price * quantity' })
  total!: number;

  @ApiPropertyOptional({ name: 'user_id', nullable: true })
  user_id?: number | null;

  @ApiProperty({ name: 'created_at' })
  created_at!: number;

  @ApiPropertyOptional({ type: PaymentRecordDto, nullable: true })
  payment?: PaymentRecordDto | null;
}
