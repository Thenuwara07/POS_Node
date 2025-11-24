import { ApiProperty } from '@nestjs/swagger';
import { BatchDto } from './batch.dto';

export class ItemDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '0729701639' })
  itemcode!: string | null; // barcode can be null in your schema

  @ApiProperty({ example: 'Coca Cola 500ml' })
  name!: string;

  @ApiProperty({ example: '#FF0000' })
  colorCode!: string;

  @ApiProperty({ type: [BatchDto] })
  batches!: BatchDto[];
}
