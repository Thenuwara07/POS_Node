import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ProfitPeriod } from './profit-period.enum';

export class MarginsQueryDto {
  @ApiPropertyOptional({
    enum: ProfitPeriod,
    description:
      'Quick period filter. Ignored when fromTs/toTs are provided.',
    example: ProfitPeriod.ALL_TIME,
  })
  @IsOptional()
  @IsEnum(ProfitPeriod)
  period?: ProfitPeriod;

  /** UNIX ms (BigInt in DB); default = last 30 days */
  @IsOptional() @IsInt() fromTs?: number;
  @IsOptional() @IsInt() toTs?: number;

  /** optional quick search by item/category name */
  @IsOptional() @IsString() q?: string;

  /** pagination for product rows */
  @IsOptional() @IsInt() @Min(0) skip?: number = 0;
  @IsOptional() @IsInt() @Min(1) take?: number = 50;
}
