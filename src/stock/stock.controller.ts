// src/stock/stock.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
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

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

// @ApiTags('Stock')
// @ApiBearerAuth('JWT-auth')
// @UseGuards(AuthGuard('jwt'), RolesGuard)
// @Roles('StockKeeper')

@Controller('stock')
export class StockController {
  constructor(private readonly stock: StockService) {}

  // CREATE
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

  // UPDATE
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
    @CurrentUser() _user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemDto,
  ) {
    return this.stock.updateItem(id, dto); // ✅ service expects (id, dto)
  }

  // LIST (with filters)
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
    @CurrentUser() _user: any,
    @Query('q') q?: string,
    @Query('categoryId') categoryIdRaw?: string,
    @Query('supplierId') supplierIdRaw?: string,
    @Query('skip') skipRaw?: string,
    @Query('take') takeRaw?: string,
  ) {
    const categoryId =
      typeof categoryIdRaw === 'string' ? parseInt(categoryIdRaw, 10) : undefined;
    const supplierId =
      typeof supplierIdRaw === 'string' ? parseInt(supplierIdRaw, 10) : undefined;
    const skip = typeof skipRaw === 'string' ? parseInt(skipRaw, 10) : undefined;
    const take = typeof takeRaw === 'string' ? parseInt(takeRaw, 10) : undefined;

    return this.stock.getItems({
      q: q || undefined,
      categoryId: Number.isFinite(categoryId as number) ? (categoryId as number) : undefined,
      supplierId: Number.isFinite(supplierId as number) ? (supplierId as number) : undefined,
      skip: Number.isFinite(skip as number) ? (skip as number) : undefined,
      take: Number.isFinite(take as number) ? (take as number) : undefined,
    }); // ✅ service method is getItems(params)
  }

  // GET BY ID
  @Get('items/:id')

  @ApiOperation({ summary: 'Get a single item by ID' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Item fetched successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  getItem(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.stock.getItem(user, id);

  @ApiOperation({ summary: 'Get an item by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Single item' })
  getItem(@CurrentUser() _user: any, @Param('id', ParseIntPipe) id: number) {
    return this.stock.getItemById(id); // ✅ service method is getItemById(id)
  }

  // DELETE
  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete an item by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Item deleted' })
  deleteItem(@CurrentUser() _user: any, @Param('id', ParseIntPipe) id: number) {
    return this.stock.deleteItem(id); // ✅ service method is deleteItem(id)

  }
}
