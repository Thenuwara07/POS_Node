import { IsNumber, IsString } from 'class-validator';

export class TopSellingItemDto {
  @IsString()
  name: string; // Item name

  @IsNumber()
  totalSold: number; // Total quantity sold

  @IsNumber()
  totalRevenue: number; // Total revenue from this item
}
