import { IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceDto } from './create-invoice.dto';

export class UpdateStockDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceDto)
  invoices!: CreateInvoiceDto[];

  @IsOptional()
  @IsBoolean()
  allOrNothing?: boolean;
}
