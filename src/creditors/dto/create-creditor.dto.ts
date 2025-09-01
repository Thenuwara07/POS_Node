import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCreditorDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim())
  name!: string;

  @IsString()
  @Length(7, 25)
  @Transform(({ value }) => String(value).replace(/\s+/g, '').trim())
  phone!: string;
}
