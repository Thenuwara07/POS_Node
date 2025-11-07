// dto/insight-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InsightPeriod } from './insight-period.enum';

export class InsightQueryDto {
  @ApiPropertyOptional({ description: 'Stockkeeper user id (Payment.userId)', example: 12 })
  @IsInt()
  @Type(() => Number)
  stockkeeperId!: number;

  @ApiPropertyOptional({ enum: InsightPeriod, default: InsightPeriod.LAST_7_DAYS })
  @IsOptional()
  @IsEnum(InsightPeriod)
  period?: InsightPeriod;

  @ApiPropertyOptional({ description: 'Custom range start (ISO 8601)', example: '2025-10-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'Custom range end (ISO 8601)', example: '2025-10-31T23:59:59.999Z' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ description: 'Top items limit', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
