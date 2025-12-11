import { ApiProperty } from '@nestjs/swagger';
import { PaymentRecordDto } from './payment-record.dto';

export class BillHistorySummaryDto {
  @ApiProperty({ example: 120, description: 'Total sales amount for today' })
  today_sales!: number;

  @ApiProperty({ example: 0, description: 'Total drawer IN for today' })
  today_in!: number;

  @ApiProperty({ example: 0, description: 'Total drawer OUT for today' })
  today_out!: number;

  @ApiProperty({
    example: 120,
    description: 'Net today (sales + IN - OUT)',
  })
  today_net!: number;
}

export class BillHistoryLatestExchangeDto {
  @ApiProperty() id!: number;
  @ApiProperty() amount!: number;
  @ApiProperty() type!: string;
  @ApiProperty() reason!: string;
  @ApiProperty({
    description: 'Epoch millis',
    example: 1733963400000,
  })
  date!: number;
}

export class BillHistoryDto {
  @ApiProperty({ type: BillHistorySummaryDto })
  summary!: BillHistorySummaryDto;

  @ApiProperty({ type: BillHistoryLatestExchangeDto, nullable: true })
  latest_exchange!: BillHistoryLatestExchangeDto | null;

  @ApiProperty({ type: PaymentRecordDto, isArray: true })
  bills!: PaymentRecordDto[];
}
