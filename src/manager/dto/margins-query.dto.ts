import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class MarginsQueryDto {
  /** UNIX ms (BigInt in DB); default = last 30 days */
  @IsOptional() @IsInt() fromTs?: number;
  @IsOptional() @IsInt() toTs?: number;

  /** optional quick search by item/category name */
  @IsOptional() @IsString() q?: string;

  /** pagination for product rows */
  @IsOptional() @IsInt() @Min(0) skip?: number = 0;
  @IsOptional() @IsInt() @Min(1) take?: number = 50;
}
