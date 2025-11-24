import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, IsIn } from 'class-validator';

// Whitelist orderings to avoid SQL injection
export type DrawerOrderKey = 'date_desc_id_desc' | 'date_asc_id_asc';

export class QueryDrawersDto {
  @ApiPropertyOptional({ type: Number, example: 50 })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ type: Number, example: 0 })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ type: Number, example: 1, description: 'Filter by user_id' })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ type: String, example: 'IN', description: 'Filter by type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ type: Number, example: 1731200000000, description: 'date >= this epoch ms' })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  dateFromMillis?: number;

  @ApiPropertyOptional({ type: Number, example: 1731286399000, description: 'date <= this epoch ms' })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  dateToMillis?: number;

  @ApiPropertyOptional({
    enum: ['date_desc_id_desc', 'date_asc_id_asc'],
    example: 'date DESC, id DESC',
  })
  @IsOptional()
  @IsIn(['date_desc_id_desc', 'date_asc_id_asc'])
  orderBy?: DrawerOrderKey;
}
