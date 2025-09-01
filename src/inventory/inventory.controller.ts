import { Controller, Get } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ItemDto } from './dto/total-items.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  async getAllItems(): Promise<ItemDto[]> {
    return this.inventoryService.getAllItems();
  }
}
