import { ApiProperty } from '@nestjs/swagger';

export class PaymentRecordDto {
  @ApiProperty() id!: number;
  @ApiProperty() amount!: number;
  @ApiProperty({ name: 'cash_amount' }) cash_amount!: number;
  @ApiProperty({ name: 'card_amount' }) card_amount!: number;
  @ApiProperty({ name: 'remain_amount' }) remain_amount!: number;
  @ApiProperty() date!: number;
  @ApiProperty({ name: 'file_name' }) file_name!: string;
  @ApiProperty({ example: 'Cash', enum: ['Cash', 'Card', 'Split'] })
  type!: 'Cash' | 'Card' | 'Split';
  @ApiProperty({ name: 'sale_invoice_id', nullable: true }) sale_invoice_id!: string | null;
  @ApiProperty({ name: 'user_id', nullable: true }) user_id!: number | null;
  @ApiProperty({ name: 'customer_contact', nullable: true }) customer_contact!: string | null;
  @ApiProperty({ name: 'discount_type' }) discount_type!: 'no' | 'percentage' | 'amount';
  @ApiProperty({ name: 'discount_value' }) discount_value!: number;
}
