import {
  Body,
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StockService } from './stock.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { CreateStockDto } from './dto/create-stock.dto';

import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Stock')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('StockKeeper')
@Controller('stock')
@UsePipes(
  // Best practice for request validation in controllers
  new ValidationPipe({
    whitelist: true,              // strip unknown props
    forbidNonWhitelisted: true,   // 400 if extra props are sent
    transform: true,              // transform primitives
  }),
)
export class StockController {
  private readonly logger = new Logger(StockController.name);

  constructor(private readonly stock: StockService) {}

  // --- CATEGORY: Create ---
  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiCreatedResponse({ description: 'Category created.' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiConflictResponse({ description: 'Duplicate category (name/code).' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    try {
      return await this.stock.createCategory(dto);
    } catch (err: any) {
      // Let known HttpExceptions bubble up; wrap unknowns
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to create category', err?.stack || err);
      throw new InternalServerErrorException('Failed to create category');
    }
  }

  // --- ITEM: Create ---
  @Post('createItem')
  @ApiOperation({ summary: 'Create a new item' })
  @ApiBody({ type: CreateItemDto })
  @ApiCreatedResponse({ description: 'Item created.' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiConflictResponse({ description: 'Duplicate barcode or unique field.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async createItem(@Body() dto: CreateItemDto) {
    try {
      return await this.stock.createItem(dto);
    } catch (err: any) {
      if (err?.status && err?.response) throw err; // known HttpException from service
      this.logger.error('Failed to create item', err?.stack || err);
      throw new InternalServerErrorException('Failed to create item');
    }
  }


  // --- PURCHASE: Handle Supplier Request and Create Stock ---
  @Post('purchaseRequest')
  @ApiOperation({ summary: 'Handle supplier purchase request and create stock' })
  @ApiBody({ type: CreateStockDto })
  @ApiCreatedResponse({ description: 'Stock created and request updated.' })
  async handlePurchaseRequest(@Body() dto: CreateStockDto) {
    try {
      return await this.stock.handlePurchaseRequest(dto);
    } catch (err: any) {
      // Let known HttpExceptions bubble up; wrap unknowns
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to handle purchase request', err?.stack || err);
      throw new InternalServerErrorException('Failed to handle purchase request');
    }
  }
}
