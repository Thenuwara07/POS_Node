import { IsInt, IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  sale_invoice_id!: string;
}
