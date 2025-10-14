import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  IsNotEmpty,
  Min,
  IsDateString,
} from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsNumber()
  @Min(0)
  remain_amount!: number;

  @IsOptional()
  @IsDateString()
  date?: string; // optional ISO date string

  @IsString()
  @IsOptional()
  file_name?: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsNotEmpty()
  sale_invoice_id!: string;

  @IsInt()
  @Min(1)
  user_id!: number;

  @IsOptional()
  @IsString()
  customer_contact?: string;

  @IsOptional()
  @IsString()
  discount_type?: string;

  @IsOptional()
  @IsNumber()
  discount_value?: number;
}
