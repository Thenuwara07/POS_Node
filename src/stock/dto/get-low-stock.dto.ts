import { ApiProperty } from '@nestjs/swagger';

export class GetLowStockDto {
  @ApiProperty()
  itemId!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  qty!: number;

  @ApiProperty()
  supplierName!: string;
}
