import { ApiProperty } from '@nestjs/swagger';

export class PaymentRecordDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1500.0 })
  amount!: number;

  @ApiProperty({ example: 500.0 })
  remain_amount!: number;

  @ApiProperty({ example: 1730563200000, description: 'epoch ms (BigInt -> number)' })
  date!: number;

  @ApiProperty({ example: 'receipt1.pdf' })
  file_name!: string;

  @ApiProperty({ example: 'Cash', description: 'Cash | Card (title case to match Flutter DB)' })
  type!: string;

  @ApiProperty({ example: 'INV-001', nullable: true })
  sale_invoice_id!: string | null;

  @ApiProperty({ example: 1, nullable: true })
  user_id!: number | null;

  @ApiProperty({ example: '0771234567', nullable: true })
  customer_contact!: string | null;

  @ApiProperty({ example: 'no', description: 'no | percentage | amount (lowercase to match Flutter)' })
  discount_type!: string;

  @ApiProperty({ example: 0 })
  discount_value!: number;
}
