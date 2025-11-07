// dto/sales-header.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class SalesHeaderDto {
  @ApiProperty({ example: 152345.75 })
  totalSales!: number;

  @ApiProperty({ example: 42 })
  customers!: number;

  @ApiProperty({ example: 18 })
  products!: number;
}
