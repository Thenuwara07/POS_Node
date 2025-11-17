import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreditSalesReportQueryDto {
  @ApiProperty({
    type: Number,
    description: 'Start timestamp in milliseconds since epoch',
    example: 1731715200000,
  })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  fromTs: number;

  @ApiProperty({
    type: Number,
    description: 'End timestamp in milliseconds since epoch',
    example: 1732401599999,
  })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  toTs: number;
}

export class CreditSalesRowDto {
  invoice_no: string;
  customer_contact: string | null;
  customer_name: string | null;
  total_amount: number;   // amount + remain_amount
  paid_amount: number;    // amount
  credit_amount: number;  // remain_amount
  date: bigint;           // raw payment.date
}
