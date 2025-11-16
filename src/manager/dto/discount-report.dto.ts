import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class DiscountReportQueryDto {
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

// Shape of each row returned by the query
export class DiscountReportRowDto {
  invoice_no: string;
  discount_type: string;
  discount_value: number;
  sale_total: number;      // total before discount
  final_total: number;     // amount actually charged (amount + remain_amount)
  discount_amount: number; // sale_total - final_total
  date: bigint;
}
