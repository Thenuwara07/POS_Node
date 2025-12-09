import { ApiProperty } from '@nestjs/swagger';
import { ItemDto } from './item.dto';

export class CategoryCatalogDto {
  @ApiProperty() id!: number;
  @ApiProperty() category!: string;
  @ApiProperty() colorCode!: string;
  @ApiProperty({ nullable: true }) categoryImage!: string | null;
  @ApiProperty({ type: ItemDto, isArray: true }) items!: ItemDto[];
}
