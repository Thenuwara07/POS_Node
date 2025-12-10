import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class QuickSaleItemDto {
  @ApiProperty({ example: 'Custom item' })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  name!: string;

  @ApiProperty({ example: 1 })
  @Transform(({ value }) => {
    if (typeof value === 'number') return Math.trunc(value);
    const n = Number.parseInt(String(value ?? '0'), 10);
    return Number.isFinite(n) ? n : 0;
  })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ name: 'unit_cost', example: 100.0 })
  @Transform(({ value, obj }) => Number(value ?? obj?.unitCost))
  @IsNumber()
  @Min(0)
  unit_cost!: number;

  @ApiProperty({
    name: 'unit_price',
    example: 150.0,
    description: 'Selling price per unit. Alias: price',
  })
  @Transform(({ value, obj }) =>
    Number(value ?? obj?.unitPrice ?? obj?.price),
  )
  @IsNumber()
  @Min(0)
  unit_price!: number;
}
