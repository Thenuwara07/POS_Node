import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { AuthAction } from '../../../generated/prisma-client';

export class QueryAuthLogDto {
  @IsOptional() @IsInt()
  userId?: number;

  @IsOptional() @IsEnum(AuthAction)
  action?: AuthAction;

  @IsOptional() @IsInt()
  fromTs?: number;  // ms epoch

  @IsOptional() @IsInt()
  toTs?: number;    // ms epoch

  @IsOptional() @IsInt()
  page?: number;    // default 1

  @IsOptional() @IsInt()
  pageSize?: number; // default 25
}
