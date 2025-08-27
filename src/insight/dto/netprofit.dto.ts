import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class NetProfitDto {
  @IsNumber()
  totalSales: number;

  @IsNumber()
  totalCosts: number;

  @IsNumber()
  netProfit: number;

  @IsString()
  @IsNotEmpty()
  month: string;
}
