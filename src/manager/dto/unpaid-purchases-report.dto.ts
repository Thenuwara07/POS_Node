import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UnpaidPurchasesReportQueryDto {
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

// Shape of each row returned
export class UnpaidPurchaseRowDto {
  request_id: number;
  supplier_id: number;
  supplier_name: string;
  status: string;
  total_amount: number;
  created_at: bigint;
}
