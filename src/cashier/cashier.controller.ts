import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CashierService } from './cashier.service';

import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CategoryCatalogDto } from './dto/category-catalog.dto';
import { PaymentRecordDto } from './dto/payment-record.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateInvoicesDto } from './dto/create-invoices.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateQuickSaleDto } from './dto/create-quick-sale.dto';
import { QuickSaleRecordDto } from './dto/quick-sale-record.dto';
import { QueryQuickSalesDto } from './dto/query-quick-sales.dto';
import { ReturnRichDto } from './dto/return-rich.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDoneDto } from './dto/update-return-done.dto';
import { DrawersQueryDto } from './dto/drawers-query.dto';
import {
  StockApplyResultDto,
  UpdateStockFromInvoicesPayloadDto,
} from './dto/stock-apply.dto';
import { QueryDrawersDto } from './dto/query-drawers.dto';
import { InsertDrawerDto } from './dto/insert-drawer.dto';

@ApiTags('Cashier')
@Controller('cashier')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class CashierController {
  private readonly logger = new Logger(CashierController.name);

  constructor(private readonly cashierService: CashierService) {}

  @Get('catalog')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Get categories with items and batches (quantity > 0), shaped like Flutter getCategoriesWithItemsAndBatches()',
  })
  @ApiOkResponse({
    description: 'Catalog fetched.',
    type: CategoryCatalogDto,
    isArray: true,
  })
  async getCatalog(): Promise<CategoryCatalogDto[]> {
    return this.cashierService.getCategoriesWithItemsAndBatches();
  }

  @Get('payments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all payments (Flutter-compatible snake_case keys)' })
  @ApiOkResponse({ description: 'Payments fetched.', type: PaymentRecordDto, isArray: true })
  async getAllPayments(): Promise<PaymentRecordDto[]> {
    return this.cashierService.getAllPayments();
  }

  @Post('payments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Insert a payment (auto-generates sale_invoice_id if omitted)' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiCreatedResponse({ description: 'Payment created.', type: PaymentRecordDto })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiConflictResponse({ description: 'Duplicate sale_invoice_id.' })
  async createPayment(@Body() dto: CreatePaymentDto): Promise<PaymentRecordDto> {
    return this.cashierService.insertPayment(dto);
  }

  @Post('sales')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Create a sale in one call: payment (Cash/Card/Split) + invoices + optional auto stock deduction',
  })
  @ApiQuery({
    name: 'applyStock',
    required: false,
    type: Boolean,
    example: true,
    description: 'Automatically deduct stock after invoices (default: true)',
  })
  @ApiQuery({
    name: 'allOrNothing',
    required: false,
    type: Boolean,
    example: false,
    description: 'When true, stock deduction will rollback if any line fails',
  })
  @ApiBody({ type: CreateSaleDto })
  @ApiCreatedResponse({
    description: 'Sale created.',
    schema: {
      type: 'object',
      properties: {
        sale_invoice_id: { type: 'string', example: 'INV-001' },
        payment: { type: 'object', additionalProperties: true },
        invoices: {
          type: 'object',
          properties: { count: { type: 'number', example: 3 } },
        },
        stock: {
          type: 'object',
          properties: {
            updated: { type: 'array', items: { type: 'object', additionalProperties: true } },
            warnings: { type: 'array', items: { type: 'object', additionalProperties: true } },
            missing: { type: 'array', items: { type: 'object', additionalProperties: true } },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  async createSale(
    @Body() dto: CreateSaleDto,
    @Query('applyStock', new ParseBoolPipe({ optional: true })) applyStock = true,
    @Query('allOrNothing', new ParseBoolPipe({ optional: true })) allOrNothing = false,
  ) {
    return this.cashierService.createSale(dto, applyStock, allOrNothing);
  }

  @Get('invoices')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all invoices (payments with a sale_invoice_id)' })
  @ApiOkResponse({ description: 'Invoices fetched.', type: PaymentRecordDto, isArray: true })
  async getAllInvoices(): Promise<PaymentRecordDto[]> {
    return this.cashierService.getAllInvoices();
  }

  @Post('invoices')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Insert invoices for a sale_invoice_id (transactional; aborts on any error). If unit_saled_price omitted, uses stock.sell_price - discount_amount and updates payment.amount.',
  })
  @ApiQuery({
    name: 'applyStock',
    required: false,
    type: Boolean,
    example: true,
    description: 'Automatically deduct stock after creating invoices (default: true)',
  })
  @ApiQuery({
    name: 'allOrNothing',
    required: false,
    type: Boolean,
    example: false,
    description: 'When true, stock deduction will rollback if any line is invalid',
  })
  @ApiCreatedResponse({
    description: 'Invoices inserted.',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 3 },
        stock: {
          type: 'object',
          properties: {
            updated: { type: 'array', items: { type: 'object', additionalProperties: true } },
            warnings: { type: 'array', items: { type: 'object', additionalProperties: true } },
            missing: { type: 'array', items: { type: 'object', additionalProperties: true } },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation/Relation error.' })
  async insertInvoices(
    @Body() dto: CreateInvoicesDto,
    @Query('applyStock', new ParseBoolPipe({ optional: true })) applyStock = true,
    @Query('allOrNothing', new ParseBoolPipe({ optional: true })) allOrNothing = false,
  ) {
    return this.cashierService.insertInvoices(dto, applyStock, allOrNothing);
  }

  @Post('quick-sales')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Create a quick sale (no stock deduction). Auto-creates payment and quick-sale invoice lines.',
  })
  @ApiBody({ type: CreateQuickSaleDto })
  @ApiCreatedResponse({
    description: 'Quick sale created with payment + quick-sale invoice rows.',
    schema: {
      type: 'object',
      properties: {
        sale_invoice_id: { type: 'string', example: 'INV-QUICK-001' },
        total: { type: 'number', example: 1500.0 },
        payment: { type: 'object', additionalProperties: true },
        quick_sales: {
          type: 'array',
          items: { type: 'object', additionalProperties: true },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  async createQuickSale(@Body() dto: CreateQuickSaleDto) {
    return this.cashierService.createQuickSale(dto);
  }

  @Get('quick-sales')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List quick sales (optional filter by userId, with payment details).',
  })
  @ApiOkResponse({ type: QuickSaleRecordDto, isArray: true })
  async listQuickSales(@Query() q: QueryQuickSalesDto) {
    return this.cashierService.getQuickSales(q);
  }

  @Get('returns')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all returns (SELECT * FROM "return" ORDER BY created_at DESC)' })
  @ApiOkResponse({
    description: 'Returns fetched.',
    schema: {
      type: 'array',
      items: { type: 'object', additionalProperties: true },
    },
  })
  async getAllReturns(): Promise<Record<string, any>[]> {
    return this.cashierService.getAllReturns();
  }

  @Get('sales/:sale_invoice_id/bundle')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Get payment header + invoice lines for a sale (header then lines).',
  })
  @ApiParam({ name: 'sale_invoice_id', example: 'INV-001' })
  @ApiOkResponse({
    description: 'Header + lines array.',
    schema: { type: 'array', items: { type: 'object', additionalProperties: true } },
  })
  async getSaleBundleList(
    @Param('sale_invoice_id') saleInvoiceId: string,
  ): Promise<Record<string, any>[]> {
    return this.cashierService.getSaleBundleList(saleInvoiceId);
  }

  @Get('returns/rich')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Get returns with joined user & item (Flutter parity shape of getReturnsRich).',
  })
  @ApiOkResponse({
    description: 'Returns (rich) fetched.',
    type: ReturnRichDto,
    isArray: true,
  })
  async getReturnsRich(): Promise<ReturnRichDto[]> {
    return this.cashierService.getReturnsRich();
  }

  @Post('returns')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Insert a return row (parity with Flutter insertReturn). Accepts snake_case or camelCase keys.',
  })
  @ApiBody({ type: CreateReturnDto })
  @ApiCreatedResponse({
    description: 'Return created.',
    schema: { type: 'object', properties: { id: { type: 'number', example: 42 } } },
  })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiConflictResponse({ description: 'Duplicate unique value (if any).' })
  async insertReturn(@Body() dto: CreateReturnDto): Promise<{ id: number }> {
    return this.cashierService.insertReturn(dto);
  }

  @Delete('returns/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a return row by id' })
  @ApiParam({ name: 'id', type: Number, example: 42 })
  @ApiOkResponse({
    description: 'Delete success.',
    schema: { type: 'object', properties: { deleted: { type: 'number', example: 1 } } },
  })
  @ApiNotFoundResponse({ description: 'Return not found.' })
  async deleteReturn(@Param('id', ParseIntPipe) id: number) {
    return this.cashierService.deleteReturn(id);
  }

  @Patch('returns/:id/done')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle is_done for a return row (0/1) by id' })
  @ApiParam({ name: 'id', type: Number, example: 42 })
  @ApiOkResponse({
    description: 'Update success.',
    schema: { type: 'object', properties: { updated: { type: 'number', example: 1 } } },
  })
  @ApiNotFoundResponse({ description: 'Return not found.' })
  @ApiBadRequestResponse({ description: 'Validation error.' })
  async toggleDone(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateReturnDoneDto,
  ) {
    return this.cashierService.toggleReturnDone(id, body);
  }

  @Delete('returns')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete ALL rows from the return table' })
  @ApiOkResponse({
    description: 'All returns cleared.',
    schema: { type: 'object', properties: { deleted: { type: 'number', example: 12 } } },
  })
  async clearAllReturns() {
    return this.cashierService.clearAllReturns();
  }

  @Get('drawers/user/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'List drawer rows for a user, ordered by date DESC; optionally restrict to today (epoch-ms window).',
  })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiQuery({ name: 'todayOnly', required: false, type: Boolean, example: false })
  @ApiOkResponse({
    description: 'Drawer rows returned (may be empty).',
    schema: { type: 'array', items: { type: 'object', additionalProperties: true } },
  })
  async getDrawersByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('todayOnly', new ParseBoolPipe({ optional: true })) todayOnly?: boolean,
  ) {
    return this.cashierService.getDrawersByUserId(userId, !!todayOnly);
  }

  @Get('drawers/user/:userId/exists')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Return { has: boolean } if user has drawer rows (optional todayOnly)' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiQuery({ name: 'todayOnly', required: false, type: Boolean, example: false })
  @ApiOkResponse({ schema: { type: 'object', properties: { has: { type: 'boolean', example: true } } } })
  async hasDrawersByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('todayOnly', new ParseBoolPipe({ optional: true })) todayOnly?: boolean,
  ) {
    return this.cashierService.hasDrawersByUserId(userId, !!todayOnly);
  }

  @Get('shops/latest')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get latest shop row by id DESC (or null if none)' })
  @ApiOkResponse({ description: 'Shop row or null', schema: { oneOf: [{ type: 'object' }, { type: 'null' }] } })
  async getLatestShopById() {
    return this.cashierService.getLatestShopById();
  }

  @Get('drawers/user/:userId/list')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'List drawers by user with pagination. orderBy: date_desc_id_desc (default) | date_asc_id_asc',
  })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Drawer rows',
    schema: { type: 'array', items: { type: 'object', additionalProperties: true } },
  })
  async getDrawersByUserIdPaged(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() q: DrawersQueryDto,
  ) {
    return this.cashierService.getDrawersByUserIdPaged(
      userId,
      q.limit,
      q.offset,
      q.orderBy ?? 'date_desc_id_desc',
    );
  }

  @Post('stock/apply-from-invoices')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Apply stock deductions from invoice lines. Set allOrNothing=true to rollback if any line fails.',
  })
  @ApiQuery({
    name: 'allOrNothing',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiBody({ type: UpdateStockFromInvoicesPayloadDto })
  @ApiOkResponse({
    description: 'Result of applying stock changes.',
    type: StockApplyResultDto,
  })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async updateStockFromInvoicesPayload(
    @Body() payload: UpdateStockFromInvoicesPayloadDto,
    @Query('allOrNothing', new ParseBoolPipe({ optional: true }))
    allOrNothing = false,
  ): Promise<StockApplyResultDto> {
    return this.cashierService.updateStockFromInvoicesPayload(
      payload,
      allOrNothing,
    );
  }

  @Post('drawers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Insert drawer row (flexible keys, epoch/ISO date)',
  })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: { id: { type: 'number', example: 123 } },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async insertDrawer(@Body() dto: InsertDrawerDto) {
    return this.cashierService.insertDrawer(dto);
  }

  @Get('drawers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'List drawers with optional filters (userId, type, dateFromMillis, dateToMillis) and pagination',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'dateFromMillis', required: false, type: Number })
  @ApiQuery({ name: 'dateToMillis', required: false, type: Number })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['date_desc_id_desc', 'date_asc_id_asc'],
  })
  @ApiOkResponse({
    description: 'Drawer rows',
    schema: { type: 'array', items: { type: 'object', additionalProperties: true } },
  })
  async getAllDrawers(@Query() q: QueryDrawersDto) {
    return this.cashierService.getAllDrawers(q);
  }

  @Get('drawers/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get drawer by id (returns object or null)' })
  @ApiParam({ name: 'id', type: Number, example: 42 })
  @ApiOkResponse({
    description: 'Row or null',
    schema: { oneOf: [{ type: 'object' }, { type: 'null' }] },
  })
  async getDrawerById(@Param('id', ParseIntPipe) id: number) {
    return this.cashierService.getDrawerById(id);
  }
}
