import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMethod } from '../../../generated/prisma-client';

export class TransactionHistoryReportQueryDto {
  @ApiProperty({
    description:
      'From timestamp (inclusive) in **milliseconds since epoch** (BigInt in DB)',
    example: '1731283200000',
  })
  @IsNotEmpty()
  @IsString()
  fromTs!: string;

  @ApiProperty({
    description:
      'To timestamp (inclusive) in **milliseconds since epoch** (BigInt in DB)',
    example: '1731887999999',
  })
  @IsNotEmpty()
  @IsString()
  toTs!: string;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    description: 'Optional filter by payment type (CASH / CARD)',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  type?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Optional filter by cashier (user) id',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}
