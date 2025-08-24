// src/stock/stock.controller.ts
import {
  Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StockService } from './stock.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Stock')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
// Ensure this matches your system (use same case string as your RolesGuard expects)
@Roles('StockKeeper')
@Controller('stock')
export class StockController {
  constructor(private readonly stock: StockService) {}

  // ADD ITEM
  @Post('items')
  @ApiOperation({ summary: 'Create a new item' })
  @ApiBody({ type: CreateItemDto })
  @ApiResponse({ status: 201, description: 'Item created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  createItem(@CurrentUser() user: any, @Body() dto: CreateItemDto) {
    return this.stock.createItem(user, dto);
  }

  // UPDATE ITEM
  @Put('items/:id')
  @ApiOperation({ summary: 'Update an existing item' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiBody({ type: UpdateItemDto })
  @ApiResponse({ status: 200, description: 'Item updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  updateItem(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemDto,
  ) {
    return this.stock.updateItem(user, id, dto);
  }

  // GET ALL ITEMS
  @Get('items')
  @ApiOperation({ summary: 'List items with optional filters' })
  @ApiQuery({ name: 'q', required: false, description: 'Free text search' })
  @ApiQuery({ name: 'supplierId', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'barcode', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Items fetched successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  listItems(
    @CurrentUser() user: any,
    @Query('q') q?: string,
    @Query('supplierId') supplierIdRaw?: string,
    @Query('category') category?: string,
    @Query('barcode') barcode?: string,
  ) {
    const supplierId =
      supplierIdRaw !== undefined && supplierIdRaw !== null
        ? Number(supplierIdRaw)
        : undefined;

    return this.stock.listItems(user, { q, supplierId, category, barcode });
  }

  // GET ITEM BY ID
  @Get('items/:id')
  @ApiOperation({ summary: 'Get a single item by ID' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Item fetched successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  getItem(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.stock.getItem(user, id);
  }
}
