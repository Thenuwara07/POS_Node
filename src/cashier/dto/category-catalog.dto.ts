import { ApiProperty } from '@nestjs/swagger';
import { ItemDto } from './item.dto';

export class CategoryCatalogDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Beverages' })
  category!: string;

  @ApiProperty({ example: '#FF5733' })
  colorCode!: string;

  @ApiProperty({ example: 'beverages.png', nullable: true })
  categoryImage!: string | null;

  @ApiProperty({ type: [ItemDto] })
  items!: ItemDto[];
}
