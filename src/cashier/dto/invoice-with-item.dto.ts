import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceWithItemDto {
  @ApiProperty({ name: 'item_id', example: 1 })
  item_id!: number;

  @ApiProperty({ name: 'batch_id', example: 'BATCH-001' })
  batch_id!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ name: 'unit_saled_price', example: 120.0 })
  unit_saled_price!: number;

  @ApiPropertyOptional({ example: 'Dell Mouse', nullable: true })
  name!: string | null;

  @ApiPropertyOptional({ example: 'electronics', nullable: true })
  category!: string | null;

  @ApiPropertyOptional({ name: 'tiny_discount', example: 0 })
  tiny_discount!: number;
}
