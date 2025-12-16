import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PerformancePeriod } from './performance-period.enum';

export class PerformanceQueryDto {
  @ApiPropertyOptional({
    enum: PerformancePeriod,
    default: PerformancePeriod.TODAY,
    description: 'Period to summarize',
  })
  @IsOptional()
  @IsEnum(PerformancePeriod)
  period?: PerformancePeriod;
}
