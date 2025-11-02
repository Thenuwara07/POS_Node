import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  Req,
  Param,
  Patch,
  ParseIntPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StockService } from './stock.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemWithStockDto } from './dto/create-item-with-stock.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { itemImageMulterOptions } from '../common/upload/multer.options';
import { categoryImageMulterOptions } from '../common/upload/multer.category.options';
import type { Request } from 'express';
import { GetAllItemsDto } from './dto/get-all-items.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { RestockDto } from './dto/restock.dto';

@ApiTags('Stock')
@Controller('stock')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class StockController {
  private readonly logger = new Logger(StockController.name);

  constructor(private readonly stockService: StockService) {}

  // ---------------------------------------------------------------------------------------------





  // --- CATEGORY: Create with image (file OR base64) ---
  @Post('categories')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new category (supports image upload or base64)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', categoryImageMulterOptions()))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        category: { type: 'string', example: 'Electronics' },
        colorCode: { type: 'string', example: '#FF0000' },
        image: { type: 'string', format: 'binary' },
        imageBase64: { type: 'string', example: 'data:image/png;base64,iVBOR...' },
      },
      required: ['category', 'colorCode'],
    },
  })
  @ApiCreatedResponse({ description: 'Category created.' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiConflictResponse({ description: 'Duplicate category name.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: Request,
  ) {
    this.logger.log('Creating category request received', {
      category: dto.category,
      hasFile: !!file,
      hasBase64: !!dto.imageBase64
    });

    try {
      // Extract user ID from JWT token
      const userId = this.extractUserIdFromRequest(req);
      this.logger.log(`Extracted user ID: ${userId}`);

      const result = await this.stockService.createCategory(dto, file, userId);
      this.logger.log('Category created successfully');
      return result;
    } catch (err: any) {
      this.logger.error('Failed to create category', err.stack);
      if (err?.status && err?.response) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to create category'
      );
    }
  }





  // ---------------------------------------------------------------------------------------------




  // --- ITEM: Create (with optional image) ---
  @Post('items')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new item (with optional initial stock & image)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', itemImageMulterOptions()))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Dell Mouse' },
        barcode: { type: 'string', example: '8901234567890' },
        categoryId: { type: 'integer', example: 1 },
        supplierId: { type: 'integer', example: 3 },
        reorderLevel: { type: 'integer', example: 5 },
        gradient: { type: 'string', example: 'linear(#0ea5e9,#22d3ee)' },
        remark: { type: 'string', example: 'Wireless mouse' },
        colorCode: { type: 'string', example: '#000000' },
        image: { type: 'string', format: 'binary' },
        imageBase64: { type: 'string', example: 'data:image/png;base64,iVBOR...' },
        quantity: { type: 'integer', example: 100 },
        unitPrice: { type: 'number', example: 450.0 },
        sellPrice: { type: 'number', example: 650.0 },
      },
      required: ['name', 'categoryId', 'supplierId'],
    },
  })
  @ApiCreatedResponse({ description: 'Item created (+ stock if provided).' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiConflictResponse({ description: 'Duplicate barcode.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async createItemWithStock(
    @Body() dto: CreateItemWithStockDto,
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: Request,
  ) {
    this.logger.log('Creating item request received', {
      itemName: dto.name,
      categoryId: dto.categoryId,
      supplierId: dto.supplierId,
      hasFile: !!file,
      hasBase64: !!dto.imageBase64,
      hasStock: !!(dto.quantity && dto.unitPrice && dto.sellPrice)
    });

    try {
      // Extract user ID from JWT token
      const userId = this.extractUserIdFromRequest(req);
      this.logger.log(`Extracted user ID: ${userId}`);

      const result = await this.stockService.createItemWithOptionalStock(dto, file, userId);
      this.logger.log('Item created successfully');
      return result;
    } catch (err: any) {
      this.logger.error('Failed to create item', err.stack);
      if (err?.status && err?.response) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to create item'
      );
    }
  }







  // ---------------------------------------------------------------------------------------------




  // --- PURCHASE: Create Stock ---
  @Post('purchase')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create stock for existing item' })
  @ApiCreatedResponse({ description: 'Stock created.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async createStock(@Body() dto: CreateStockDto) {
    this.logger.log('Creating stock request received', {
      itemId: dto.itemId,
      supplierId: dto.supplierId,
      quantity: dto.quantity
    });

    try {
      const result = await this.stockService.handlePurchaseRequest(dto);
      this.logger.log('Stock created successfully');
      return result;
    } catch (err: any) {
      this.logger.error('Failed to create stock', err.stack);
      if (err?.status && err?.response) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to create stock'
      );
    }
  }




  
  
  // ---------------------------------------------------------------------------------------------


  // --- CATEGORY: List ---
  @Get('categories')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all categories' })
  @ApiUnauthorizedResponse({description:'Missing/Invalid JWT.'})
  @ApiForbiddenResponse({description: 'Insufficient role permissions.'})
  @ApiInternalServerErrorResponse({description: 'Unexpected server error.'})
  @ApiOkResponse({ description: 'Categories fetched.' })
  async listCategories() {
    this.logger.log('Fetching categories list');
    try {
      const categories = await this.stockService.listCategories();
      this.logger.log(`Returning ${categories.length} categories`);
      return categories;
    } catch (err: any) {
      this.logger.error('Failed to fetch categories', err.stack);
      throw new InternalServerErrorException('Failed to fetch categories');
    }
  }





  // ---------------------------------------------------------------------------------------------
 

  // --- ITEMS: List with summaries ---
  @Get('items')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER', 'MANAGER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List items with category, creator, qty, weighted prices, status & total',
  })
  @ApiOkResponse({ description: 'Item summaries fetched.', type: [GetAllItemsDto] })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async listItems(): Promise<GetAllItemsDto[]> {
    this.logger.log('Fetching items list with summaries');
    try {
      const items = await this.stockService.listItems();
      this.logger.log(`Returning ${items.length} items`);
      return items;
    } catch (err: any) {
      this.logger.error('Failed to fetch items', err.stack);
      throw new InternalServerErrorException('Failed to fetch item summaries');
    }
  }



  // ---------------------------------------------------------------------------------------------



  // --- ITEM: Update ---
@Patch('items/:id')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('STOCKKEEPER', 'MANAGER', 'ADMIN')
@ApiBearerAuth('JWT-auth')
@ApiConsumes('multipart/form-data')
@UseInterceptors(FileInterceptor('image', itemImageMulterOptions()))
@ApiOperation({ summary: 'Update an existing item (supports image upload or base64)' })
@ApiOkResponse({ description: 'Item updated successfully.' })
@ApiBadRequestResponse({ description: 'Validation failed or item not found.' })
@ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
@ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
@ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
async updateItem(
  @Param('id') id: number,
  @Body() dto: UpdateItemDto,
  @UploadedFile() file?: Express.Multer.File,
  @Req() req?: Request,
) {
  this.logger.log(`Updating item ID: ${id}`, {
    name: dto.name,
    barcode: dto.barcode,
    hasFile: !!file,
    hasBase64: !!dto.imageBase64,
  });

  try {
    const userId = this.extractUserIdFromRequest(req);
    const result = await this.stockService.updateItem(id, dto, file, userId);
    this.logger.log(`Item updated successfully: ${id}`);
    return result;
  } catch (err: any) {
    this.logger.error(`Failed to update item: ${err.message}`, err.stack);
    if (err?.status && err?.response) throw err;
    throw new InternalServerErrorException(err.message || 'Failed to update item');
  }
}




  //----------------------------------------------------------------------------------------------------



  // --- ITEM: Disable (status -> 0) ---
@Patch('items/:id/disable')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('STOCKKEEPER', 'MANAGER', 'ADMIN')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Disable an item (soft delete: status = 0)' })
@ApiOkResponse({ description: 'Item disabled.' })
async disableItem(
  @Param('id', ParseIntPipe) id: number,
  @Req() req?: Request,
) {
  this.logger.log(`Disabling item ID: ${id}`);
  const userId = this.extractUserIdFromRequest(req);
  return await this.stockService.setItemStatus(id, 0, userId);
}

// --- ITEM: Enable (status -> 1) ---
@Patch('items/:id/enable')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('STOCKKEEPER', 'MANAGER', 'ADMIN')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Enable an item (status = 1)' })
@ApiOkResponse({ description: 'Item enabled.' })
async enableItem(
  @Param('id', ParseIntPipe) id: number,
  @Req() req?: Request,
) {
  this.logger.log(`Enabling item ID: ${id}`);
  const userId = this.extractUserIdFromRequest(req);
  return await this.stockService.setItemStatus(id, 1, userId);
}

// --- ITEMS: Get all disabled (status = 0) ---
@Get('items/disabled')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('STOCKKEEPER', 'MANAGER', 'ADMIN')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'List all disabled items (status = 0) with summaries' })
@ApiOkResponse({ description: 'Disabled items fetched.', type: [GetAllItemsDto] })
async listDisabledItems(): Promise<GetAllItemsDto[]> {
  this.logger.log('Fetching disabled items (status=0)');
  return await this.stockService.listItemsByStatus(0);
}

// --- ITEMS: Get all enabled (status = 1) ---
@Get('items/enabled')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('STOCKKEEPER', 'MANAGER', 'ADMIN')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'List all enabled items (status = 1) with summaries' })
@ApiOkResponse({ description: 'Enabled items fetched.', type: [GetAllItemsDto] })
async listEnabledItems(): Promise<GetAllItemsDto[]> {
  this.logger.log('Fetching enabled items (status=1)');
  return await this.stockService.listItemsByStatus(1);
}

  // ---------------------------------------------------------------------------------------------



@Get('restock/lookup')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('STOCKKEEPER')
@ApiBearerAuth('JWT-auth')
@ApiOperation({
  summary: 'Lookup item for restock by id | name | barcode',
  description:
    'Returns item details for the restock UI. q can be numeric ID, exact barcode, or a (case-insensitive) partial name.',
})
@ApiOkResponse({ description: 'Restock details fetched.', type: RestockDto })
@ApiBadRequestResponse({ description: 'Missing or invalid query.' })
@ApiNotFoundResponse({ description: 'Item not found.' })
async lookupForRestock(
  @Query('q') q?: string,
): Promise<RestockDto> {
  this.logger.log(`Restock lookup for q="${q}"`);
  if (!q || !q.trim()) {
    throw new BadRequestException('Query "q" is required.');
  }
  return this.stockService.lookupItemForRestock(q.trim());
}


  



  // ---------------------------------------------------------------------------------------------

  /**
   * Extract user ID from JWT token in request
   */
  private extractUserIdFromRequest(req?: Request): number | undefined {
    if (!req?.user) {
      this.logger.warn('No user found in request');
      return undefined;
    }

    const user = req.user as any;
    this.logger.debug('User object from request:', user);

    // Try different possible locations for user ID
    const userId = user.userId || user.sub || user.id;
    
    if (userId) {
      this.logger.log(`Extracted user ID: ${userId}`);
      return typeof userId === 'string' ? parseInt(userId, 10) : userId;
    }

    this.logger.warn('Could not extract user ID from request user object');
    return undefined;
  }
}