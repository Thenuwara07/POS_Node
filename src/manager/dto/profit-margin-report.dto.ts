import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProfitMarginReportQueryDto {
  static defaultFrom(): number {
    return Date.now() - 7 * 24 * 60 * 60 * 1000; // last 7 days by default
  }

  static defaultTo(): number {
    return Date.now();
  }

  @ApiPropertyOptional({
    type: Number,
    description: 'Start timestamp in milliseconds since epoch (defaults to now - 7 days)',
    example: 1731715200000,
  })
  @Transform(({ value }) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : ProfitMarginReportQueryDto.defaultFrom();
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fromTs?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'End timestamp in milliseconds since epoch (defaults to now)',
    example: 1732401599999,
  })
  @Transform(({ value }) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : ProfitMarginReportQueryDto.defaultTo();
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  toTs?: number;
}

// what each row looks like (for type hinting only)
export class ProfitMarginRowDto {
  invoice_no: string;
  gross_profit: number;
  margin_pct: number;
}
