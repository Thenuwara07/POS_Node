import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateStockDto {
  @ApiProperty({
    description: 'ID of the item being purchased',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  itemId: number;

  @ApiProperty({
    description: 'Quantity of the item to be purchased',
    example: 100,
  })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Unit price of the item',
    example: 10.0,
  })
  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @ApiProperty({
    description: 'Selling price of the item',
    example: 15.0,
  })
  @IsNumber()
  @IsPositive()
  sellPrice: number;

  @ApiProperty({
    description: 'ID of the supplier providing the stock',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  supplierId: number;

  @IsOptional()
  @IsInt()
  @IsIn([0, 1], { message: 'status must be 0 or 1' })
  status?: number
}
