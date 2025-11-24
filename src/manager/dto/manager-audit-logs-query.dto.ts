import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { AuthAction } from '../../../generated/prisma-client';

const toNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

export class ManagerAuditLogsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by user ID', example: 5 })
  @Transform(({ value }) => toNumber(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ description: 'Filter by action type', enum: AuthAction })
  @IsOptional()
  @IsEnum(AuthAction)
  action?: AuthAction;

  @ApiPropertyOptional({ description: 'Only include logs after this epoch ms', example: 1730563200000 })
  @Transform(({ value }) => toNumber(value))
  @IsOptional()
  @IsInt()
  fromTs?: number;

  @ApiPropertyOptional({ description: 'Only include logs before this epoch ms', example: 1730743200000 })
  @Transform(({ value }) => toNumber(value))
  @IsOptional()
  @IsInt()
  toTs?: number;

  @ApiPropertyOptional({ description: 'Maximum number of rows to return', example: 50, default: 50 })
  @Transform(({ value }) => toNumber(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Rows to skip for pagination', example: 0, default: 0 })
  @Transform(({ value }) => toNumber(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}
