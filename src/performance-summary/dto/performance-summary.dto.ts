import { ApiProperty } from '@nestjs/swagger';
import { PerformancePeriod } from './performance-period.enum';

export class RangeDto {
  @ApiProperty({ example: 1700000000000, description: 'Range start (epoch ms)' })
  from!: number;

  @ApiProperty({ example: 1700086399999, description: 'Range end (epoch ms)' })
  to!: number;
}

export class PerformanceMetricDto {
  @ApiProperty({ example: 1450, description: 'Current period total' })
  total!: number;

  @ApiProperty({ example: 250, description: 'Difference vs previous period' })
  delta!: number;

  @ApiProperty({
    example: 15.2,
    description: 'Percent change vs previous period (null when previous is 0)',
    nullable: true,
  })
  deltaPct!: number | null;
}

export class PerformanceSummaryDto {
  @ApiProperty({ enum: PerformancePeriod })
  period!: PerformancePeriod;

  @ApiProperty({ type: RangeDto })
  currentRange!: RangeDto;

  @ApiProperty({ type: RangeDto })
  previousRange!: RangeDto;

  @ApiProperty({ type: PerformanceMetricDto })
  sales!: PerformanceMetricDto;

  @ApiProperty({ type: PerformanceMetricDto })
  transactions!: PerformanceMetricDto;
}
