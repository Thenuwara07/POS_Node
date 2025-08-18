// src/stock/stock.controller.ts
import {Body,Controller,Get,Param,ParseIntPipe,Post,Put,Query, UseGuards} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StockService } from './stock.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('StockKeeper')
@Controller('stock')
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Post('items')
  createItem(@CurrentUser() user: any, @Body() dto: CreateItemDto) {
    return this.stock.createItem(user, dto);
  }

  @Put('items/:id')
  updateItem(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemDto,
  ) {
    return this.stock.updateItem(user, id, dto);
  }

  @Get('items')
  listItems(
    @CurrentUser() user: any,
    @Query('q') q?: string,
    @Query('supplierId') supplierIdRaw?: string,
  ) {
    const supplierId =
      supplierIdRaw !== undefined && supplierIdRaw !== null
        ? Number(supplierIdRaw)
        : undefined;

    return this.stock.listItems(user, { q, supplierId });
  }

  @Get('items/:id')
  getItem(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.stock.getItem(user, id);
  }
}
