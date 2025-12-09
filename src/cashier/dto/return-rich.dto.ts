import { ApiProperty } from '@nestjs/swagger';

class ReturnUserDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ name: 'color_code' }) color_code!: string;
}

class ReturnItemDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) barcode!: string | null;
  @ApiProperty({ name: 'color_code' }) color_code!: string;
}

export class ReturnRichDto {
  @ApiProperty() id!: number;
  @ApiProperty({ type: ReturnUserDto }) user!: ReturnUserDto;
  @ApiProperty({ name: 'batch_id' }) batch_id!: string;
  @ApiProperty({ type: ReturnItemDto }) item!: ReturnItemDto;
  @ApiProperty() quantity!: number;
  @ApiProperty({ name: 'unit_saled_price' }) unit_saled_price!: number;
  @ApiProperty({ name: 'sale_invoice_id', nullable: true }) sale_invoice_id!: string | null;
  @ApiProperty({ name: 'created_at' }) created_at!: number;
}
