import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class QueryQuickSalesDto {
  @ApiPropertyOptional({ name: 'userId', example: 1 })
  @Transform(({ value, obj }) => value ?? obj?.user_id ?? undefined)
  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ example: 50 })
  @Transform(({ value }) =>
    value == null ? undefined : Number.parseInt(String(value), 10),
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @Transform(({ value }) =>
    value == null ? undefined : Number.parseInt(String(value), 10),
  )
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}
