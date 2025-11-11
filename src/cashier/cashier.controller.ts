import {
    Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CashierService } from './cashier.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CategoryCatalogDto } from './dto/category-catalog.dto';
import { PaymentRecordDto } from './dto/payment-record.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateInvoicesDto } from './dto/create-invoices.dto';
import { ReturnRichDto } from './dto/return-rich.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDoneDto } from './dto/update-return-done.dto';

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


//   -----------------------------------------------------------------------------




  // GET /cashier/catalog
  @Get('catalog')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER') // allow both; adjust if needed
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
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async getCatalog(): Promise<CategoryCatalogDto[]> {
    return this.cashierService.getCategoriesWithItemsAndBatches();
  }

  

//   ------------------------------------------------------------------------------------------





@Get('payments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all payments (Flutter-compatible snake_case keys)' })
  @ApiOkResponse({ description: 'Payments fetched.', type: PaymentRecordDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async getAllPayments(): Promise<PaymentRecordDto[]> {
    return this.cashierService.getAllPayments();
  }




//   --------------------------------------------------------------------------------------------



@Post('payments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Insert a payment (Flutter parity with insertPayment)' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiCreatedResponse({ description: 'Payment created.', type: PaymentRecordDto })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiConflictResponse({ description: 'Duplicate sale_invoice_id.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async createPayment(@Body() dto: CreatePaymentDto): Promise<PaymentRecordDto> {
    return this.cashierService.insertPayment(dto);
  }



//   -----------------------------------------------------------------------------------------




@Post('invoices')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Insert invoices for a sale_invoice_id (transactional; aborts on any error).',
  })
  @ApiCreatedResponse({
    description: 'Invoices inserted.',
    schema: {
      type: 'object',
      properties: { count: { type: 'number', example: 3 } },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation/Relation error.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async insertInvoices(@Body() dto: CreateInvoicesDto) {
    return this.cashierService.insertInvoices(dto);
  }



//   -------------------------------------------------------------------------------------------



@Get('returns')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all returns (SELECT * FROM "return" ORDER BY created_at DESC)' })
  @ApiOkResponse({
    description: 'Returns fetched.',
    schema: {
      type: 'array',
      items: { type: 'object', additionalProperties: true }, // flexible: all columns
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async getAllReturns(): Promise<Record<string, any>[]> {
    return this.cashierService.getAllReturns();
  }







//   -------------------------------------------------------------------------------------------------







@Get('sales/:sale_invoice_id/bundle')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Get payment header + invoice lines for a sale (Flutter parity: first element is header, followed by lines).',
  })
  @ApiParam({ name: 'sale_invoice_id', example: 'INV-001' })
  @ApiOkResponse({
    description: 'Header + lines array.',
    schema: {
      type: 'array',
      items: { type: 'object', additionalProperties: true },
      example: [
        {
          sale_invoice_id: 'INV-001',
          payment_amount: 2500.5,
          payment_remain_amount: 0,
          payment_type: 'Card',
          payment_file_name: 'receipt2.pdf',
          payment_date: 1730582400000,
          payment_user_id: 1,
          customer_contact: '0779876543',
          discount_type: 'no',
          discount_value: 0,
        },
        {
          invoice_id: 10,
          batch_id: 'BATCH-PAPER-001',
          item_id: 3,
          quantity: 2,
          saled_unit_price: 480,
          item_name: 'A4 Paper Ream',
          item_barcode: 'BARC0003',
          unit_price: 450,
          sell_price: 600,
          discount_amount: 50,
          final_unit_price: 550,
          line_total: 1100,
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async getSaleBundleList(
    @Param('sale_invoice_id') saleInvoiceId: string,
  ): Promise<Record<string, any>[]> {
    return this.cashierService.getSaleBundleList(saleInvoiceId);
  }





//   -----------------------------------------------------------------------------------------




// --------------------  GET /cashier/returns/rich --------------------


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
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async getReturnsRich(): Promise<ReturnRichDto[]> {
    return this.cashierService.getReturnsRich();
  }

  


  // -------------------------------------------------------------------------------------------------




  // POST /cashier/returns


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
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async insertReturn(@Body() dto: CreateReturnDto): Promise<{ id: number }> {
    return this.cashierService.insertReturn(dto);
  }






  // ----------------------------------------------------------------------------------------------------



  // Delete Return By Id

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
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async deleteReturn(@Param('id', ParseIntPipe) id: number) {
    return this.cashierService.deleteReturn(id);
  }





  // ------------------------------------------------------------------------------------------




  // PATCH /cashier/returns/:id/done
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
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async toggleDone(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateReturnDoneDto,
  ) {
    return this.cashierService.toggleReturnDone(id, body);
    // Body supports { "is_done": true } or { "isDone": true }
  }





  // ---------------------------------------------------------------------------------------------------






  // DELETE /cashier/returns -> clears the whole table
  @Delete('returns')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER') // typically restrict to MANAGER; adjust if CASHIER may do this
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete ALL rows from the return table' })
  @ApiOkResponse({
    description: 'All returns cleared.',
    schema: { type: 'object', properties: { deleted: { type: 'number', example: 12 } } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async clearAllReturns() {
    return this.cashierService.clearAllReturns();
  }





  // --------------------------------------------------------------------------------------------------------



  // GET /cashier/drawers/user/:userId
  @Get('drawers/user/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CASHIER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List drawer rows for a user, ordered by date DESC' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Drawer rows returned (may be empty).',
    schema: { type: 'array', items: { type: 'object', additionalProperties: true } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async getDrawerByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.cashierService.getDrawerByUser(userId);
  }

}