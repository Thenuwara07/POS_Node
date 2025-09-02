import { ApiProperty } from '@nestjs/swagger';
import { ItemDto } from './total-items.dto';

export class LowStockItemDto extends ItemDto {
  @ApiProperty({ default: true })
  isLowStock: true;

  @ApiProperty({ default: 3, description: 'Threshold used to flag low stock' })
  threshold: number;
}
