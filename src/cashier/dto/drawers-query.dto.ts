import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export type DrawerOrderKey = 'date_desc_id_desc' | 'date_asc_id_asc';

export class DrawersQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value == null ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value == null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiProperty({ required: false, enum: ['IN', 'OUT'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value == null ? undefined : Number(value)))
  dateFromMillis?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value == null ? undefined : Number(value)))
  dateToMillis?: number;

  @ApiProperty({
    required: false,
    description: 'Search by id, amount, or reason',
  })
  @IsOptional()
  @Transform(({ value }) => (value == null ? undefined : String(value).trim()))
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: ['date_desc_id_desc', 'date_asc_id_asc'] })
  @IsOptional()
  @IsEnum(['date_desc_id_desc', 'date_asc_id_asc'])
  orderBy?: DrawerOrderKey;
}
