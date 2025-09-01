import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateCreditorDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  name?: string;

  @IsOptional()
  @IsString()
  @Length(7, 25)
  @Transform(({ value }) => String(value).replace(/\s+/g, '').trim())
  phone?: string;
}
