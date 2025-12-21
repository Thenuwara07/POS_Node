import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TransactionHistoryReportQueryDto {
  @ApiProperty({
    description:
      'From date for filtering transactions (inclusive). Accepts YYYY-MM-DD or ISO datetime.',
    example: '2025-12-14',
  })
  @IsNotEmpty()
  @IsString()
  from!: string;

  @ApiProperty({
    description:
      'To date for filtering transactions (inclusive). Accepts YYYY-MM-DD or ISO datetime.',
    example: '2025-12-23',
  })
  @IsNotEmpty()
  @IsString()
  to!: string;

}
