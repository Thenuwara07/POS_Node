import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateReturnDto {
  @ApiProperty({ example: 1 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  user_id!: number;

  @ApiProperty({ example: 'BATCH-001' })
  @IsString()
  batch_id!: string;

  @ApiProperty({ example: 3 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  item_id!: number;

  @ApiProperty({ example: 1 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 120 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  unit_saled_price!: number;

  @ApiProperty({ example: 'INV-001' })
  @IsString()
  sale_invoice_id!: string;

  @ApiProperty({ example: 1730563200000, required: false })
  @Transform(({ value }) => value)
  @IsOptional()
  created_at?: number | string;
}
