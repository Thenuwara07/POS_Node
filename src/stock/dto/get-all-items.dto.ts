import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetAllItemsDto {
  @ApiProperty() itemId!: number;
  @ApiProperty() name!: string;
  @ApiProperty() categoryName!: string;

  @ApiPropertyOptional({ description: 'Name of the user who created the item' })
  createdBy!: string | null;

  @ApiProperty({ description: 'Status from Item.status' })
  status!: number;

  @ApiPropertyOptional({ description: 'Stock row ID; null if no stock' })
  stockId!: number | null;

  @ApiPropertyOptional({ description: 'Batch ID; null if no stock' })
  batchId!: string | null;

  @ApiProperty({ description: 'Quantity available in this batch (0 if no stock)' })
  qty!: number;

  @ApiProperty({ description: 'Unit (cost) price for this batch; 0 if no stock' })
  unitPrice!: number;

  @ApiProperty({ description: 'Sell price for this batch; 0 if no stock' })
  sellPrice!: number;

  @ApiProperty({ description: 'qty * sellPrice' })
  total!: number;
}
