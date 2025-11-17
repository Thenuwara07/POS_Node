import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefundBillsReportQueryDto {
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
    description: 'Optional filter by cashier (user) id',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}
