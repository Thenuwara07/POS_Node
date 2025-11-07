// dto/chart-series.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ChartSeriesDto {
  @ApiProperty({ example: '2025-10-15' })
  day!: string; // YYYY-MM-DD (store as date label for charts)

  @ApiProperty({ example: 25340.5 })
  total!: number; // total sales that day
}
