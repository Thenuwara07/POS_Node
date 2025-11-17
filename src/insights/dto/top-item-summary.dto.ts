// dto/top-item-summary.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TopItemSummaryDto {
  @ApiProperty({ example: 101 })
  itemId!: number;

  @ApiProperty({ example: 'Sunlight 1kg' })
  name!: string;

  @ApiProperty({ example: 120.0 })
  price!: number; // average unit_saled_price in window

  @ApiProperty({ example: 35 })
  sold!: number; // total quantity
}
