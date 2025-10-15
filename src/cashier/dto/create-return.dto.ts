import { IsInt, IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateReturnDto {
  @IsInt()
  @Min(1)
  user_id!: number;

  @IsString()
  batch_id!: string;

  @IsInt()
  @Min(1)
  item_id!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unit_saled_price!: number;

  @IsString()
  sale_invoice_id!: string;

  @IsOptional()
  @IsNumber()
  created_at?: number; // timestamp in ms
}
