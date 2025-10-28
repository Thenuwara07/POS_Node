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
  Delete,
  ParseIntPipe,
  Param,
  Patch,
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
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

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

  // -------------------------------------------------------------------------------------------------

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
    try {
      const userId =
        (req?.user as any)?.userId ||
        (req?.user as any)?.sub ||
        undefined; // Adjust per your JWT payload

      return await this.stockService.createCategory(dto, file, userId);
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to create category', err?.stack || err);
      throw new InternalServerErrorException('Failed to create category');
    }
  }


// --------------------------------------------------------------------------------------------------------------------


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
      required: ['name',  'categoryId', 'supplierId'],
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
  ) {
    try {
      return await this.stockService.createItemWithOptionalStock(dto, file);
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to create item', err?.stack || err);
      throw new InternalServerErrorException('Failed to create item');
    }
  }



// -------------------------------------------------------------------------------------------------------------


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
    try {
      return await this.stockService.handlePurchaseRequest(dto);
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      throw new InternalServerErrorException('Failed to create stock');
    }
  }



// ----------------------------------------------------------------------------------------------------------


  // --- CATEGORY: List (PUBLIC) ---
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
    return this.stockService.listCategories();
  }


  // ---------------------------------------------------------------------------------------------------------

  

  // Add Supplier 
  @Post('suppliers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string'},
        brand: { type: 'string'},
        contact: { type: 'string'},
        email: { type: 'string'},
        location: { type: 'string'},
        notes: { type: 'string'},
        colorCode: { type: 'string'},
      },
      required: ['name', 'brand', 'contact'],
    },
  })
  @ApiCreatedResponse({ description: 'Supplier created.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async createSupplier(@Body() dto: CreateSupplierDto, @Req() req: Request) {
    try {
      const userId =
        (req?.user as any)?.userId ||
        (req?.user as any)?.sub ||
        undefined;

      return await this.stockService.createSupplier(dto, userId);
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to create supplier', err?.stack || err);
      throw new InternalServerErrorException('Failed to create supplier');
    }
  }




// --------------------------------------------------------------------------------------------

            // Get all suppliers

  @Get('suppliers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List suppliers' })
  @ApiOkResponse({ description: 'Suppliers fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async listSuppliers() {
    return this.stockService.listSuppliers();
  }




  // --------------------------------------------------------------------------------------------------

      // Get supplier by ID

  @Get('suppliers/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get supplier by id' })
  @ApiOkResponse({ description: 'Supplier fetched.' })
  async getSupplierById(@Param('id', ParseIntPipe) id: number) {
    return this.stockService.getSupplierById(id);
  }



  // --------------------------------------------------------------------------------------------

      // Update Supplier

  @Patch('suppliers/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update supplier (optional)' })
  @ApiOkResponse({ description: 'Supplier updated.' })
  async updateSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierDto,
    @Req() req: Request,
  ) {
    const userId =
      (req?.user as any)?.userId ||
      (req?.user as any)?.sub ||
      undefined;
    return this.stockService.updateSupplier(id, dto, userId);
  }


  // ---------------------------------------------------------------------------------

    //  Delete Supplier 
    

  @Delete('suppliers/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete supplier (optional)' })
  @ApiOkResponse({ description: 'Supplier deleted.' })
  async deleteSupplier(@Param('id', ParseIntPipe) id: number) {
    return this.stockService.deleteSupplier(id);
  }


}
