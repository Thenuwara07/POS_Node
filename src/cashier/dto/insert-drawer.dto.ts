import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class InsertDrawerDto {
  @ApiProperty({ example: 1000 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  amount!: number;

  @ApiProperty({ example: 'Opening float' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  reason!: string;

  @ApiProperty({ example: 'IN', enum: ['IN', 'OUT'] })
  @Transform(({ value }) => String(value).toUpperCase())
  @IsString()
  type!: string;

  @ApiProperty({ name: 'user_id', example: 1 })
  @Transform(({ value, obj }) => Number(value ?? obj?.userId))
  @IsInt()
  @Min(1)
  user_id!: number;

  @ApiProperty({ example: 1730563200000, required: false })
  @IsOptional()
  @Transform(({ value }) => value)
  date?: number | string;
}
