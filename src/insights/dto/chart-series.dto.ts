// dto/chart-series.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ChartSeriesDto {
  @ApiProperty({ example: '2025-12-24', description: 'Date in YYYY-MM-DD format' })
  day!: string;

  @ApiProperty({ example: '24 Dec', description: 'Formatted label for chart display' })
  label!: string;

  @ApiProperty({ example: 15420.50, description: 'Total sales for this day' })
  total!: number;
}