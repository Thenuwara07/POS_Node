import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { InvoiceLineDto } from './invoice-line.dto';

export class CreateInvoicesDto {
  @ApiProperty({ name: 'sale_invoice_id', example: 'INV-001' })
  @Transform(({ value, obj }) => (value ?? obj?.saleInvoiceId)?.toString())
  @IsString()
  sale_invoice_id!: string;

  @ApiProperty({ type: [InvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  invoices!: InvoiceLineDto[];
}
