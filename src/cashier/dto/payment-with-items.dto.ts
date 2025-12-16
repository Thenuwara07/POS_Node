import { ApiProperty } from '@nestjs/swagger';
import { PaymentRecordDto } from './payment-record.dto';
import { InvoiceWithItemDto } from './invoice-with-item.dto';

export class PaymentWithItemsDto extends PaymentRecordDto {
  @ApiProperty({ type: InvoiceWithItemDto, isArray: true })
  items!: InvoiceWithItemDto[];
}
