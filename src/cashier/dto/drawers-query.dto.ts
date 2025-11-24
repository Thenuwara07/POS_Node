import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Min } from 'class-validator';

// Whitelisted ordering options to avoid SQL injection
export type DrawerOrderKey = 'date_desc_id_desc' | 'date_asc_id_asc';

export class DrawersQueryDto {
  @ApiPropertyOptional({ type: Boolean, example: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
  })
  @IsBoolean()
  todayOnly?: boolean;

  @ApiPropertyOptional({ type: Number, example: 20 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ type: Number, example: 0 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({
    enum: ['date_desc_id_desc', 'date_asc_id_asc'],
    example: 'date_desc_id_desc',
  })
  @IsOptional()
  @IsIn(['date_desc_id_desc', 'date_asc_id_asc'])
  orderBy?: DrawerOrderKey;
}
