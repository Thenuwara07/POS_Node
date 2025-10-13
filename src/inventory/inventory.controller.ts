// import {
//   Body,
//   Controller,
//   Get,
//   HttpCode,
//   HttpStatus,
//   Post,
//   Query,
//   UseGuards,
// } from '@nestjs/common';
// import { InventoryService } from './inventory.service';
// import { ItemDto } from './dto/total-items.dto';
// import { LowStockItemDto } from './dto/low-stock.dto';

// import { CreateRestockDto, LookupItemQueryDto } from './dto/re-stock.dto';

// import { RolesGuard } from '../auth/roles.guard';
// import { Roles } from '../auth/roles.decorator';
// import { AuthGuard } from '@nestjs/passport';

// import {
//   ApiTags,
//   ApiOperation,
//   ApiOkResponse,
//   ApiBearerAuth,
//   ApiQuery,
//   ApiBody,
// } from '@nestjs/swagger';

// @ApiTags('inventory')
// @ApiBearerAuth('JWT-auth')
// @UseGuards(AuthGuard('jwt'), RolesGuard)
// // Allow StockKeeper, Manager, Admin
// @Roles('StockKeeper', 'Admin')
// @Controller('inventory')
// export class InventoryController {
//   constructor(private readonly inventoryService: InventoryService) {}

//   // ---------- Existing ----------
//   @Get('items')
//   @ApiOperation({ summary: 'List all items with current quantity & prices' })
//   @ApiOkResponse({ type: ItemDto, isArray: true })
//   async getAllItems(): Promise<ItemDto[]> {
//     return this.inventoryService.getAllItems();
//   }

//   @Get('low-stock')
//   @ApiOperation({
//     summary: 'List items at or below the low-stock threshold',
//   })
//   @ApiQuery({
//     name: 'threshold',
//     required: false,
//     description: 'Low stock threshold (default 3)',
//     example: 3,
//   })
//   @ApiOkResponse({ type: LowStockItemDto, isArray: true })
//   async getLowStockItems(
//     @Query('threshold') threshold?: string,
//   ): Promise<LowStockItemDto[]> {
//     let t = Number(threshold);
//     if (!Number.isFinite(t) || t <= 0) t = 3;
//     return this.inventoryService.getLowStockItems(t);
//   }

//   // ---------- NEW: lookup for barcode/code box ----------
//   @Get('items/lookup')
//   @ApiOperation({ summary: 'Lookup a single item by id or barcode and return computed current stock' })
//   @ApiQuery({ name: 'id', required: false, type: Number })
//   @ApiQuery({ name: 'barcode', required: false, type: String })
//   async lookupItem(@Query() q: LookupItemQueryDto) {
//     return this.inventoryService.lookupItemWithStock(q);
//   }

//   // ---------- NEW: bulk restock ----------
//   @Post('restock')
//   @HttpCode(HttpStatus.CREATED)
//   @ApiOperation({ summary: 'Bulk restock: create Stock batches, optional SupplierTransaction(s)' })
//   @ApiBody({ type: CreateRestockDto })
//   async restock(@Body() dto: CreateRestockDto) {
//     return this.inventoryService.restock(dto);
//   }
// }
