import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ItemDto } from './dto/total-items.dto';
import { LowStockItemDto } from '../inventory/dto/low-stock.dto';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthGuard } from '@nestjs/passport';

import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('inventory')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
// Let StockKeeper, Manager, and Admin access inventory read endpoints.
@Roles('StockKeeper')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  @ApiOperation({ summary: 'List all items with current quantity & prices' })
  @ApiOkResponse({ type: ItemDto, isArray: true })
  async getAllItems(): Promise<ItemDto[]> {
    return this.inventoryService.getAllItems();
  }

  @Get('low-stock')
  @ApiOperation({
    summary: 'List items whose quantity is at or below the low-stock threshold',
  })
  @ApiQuery({
    name: 'threshold',
    required: false,
    description: 'Low stock threshold (default 3)',
    example: 3,
  })
  @ApiOkResponse({ type: LowStockItemDto, isArray: true })
  async getLowStockItems(@Query('threshold') threshold?: string): Promise<LowStockItemDto[]> {
    let t = Number(threshold);
    if (!Number.isFinite(t) || t <= 0) t = 3;
    return this.inventoryService.getLowStockItems(t);
  }
}
