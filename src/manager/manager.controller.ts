import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  UsePipes,
  ValidationPipe,
  DefaultValuePipe,
  ParseIntPipe,
  HttpException, // ✅ ADD (for 409/400 passthrough)
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ManagerService } from './manager.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';

// --- CREDITORS ---
import { CreateCreditorDto } from './dto/create-creditor.dto';
import { UpdateCreditorDto } from './dto/update-creditor.dto';
import { CreditorService } from './services/creditor.service';

import { ManagerAuditLogsQueryDto } from './dto/manager-audit-logs-query.dto';

@ApiTags('Manager')
@Controller('manager')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class ManagerController {
  private readonly logger = new Logger(ManagerController.name);

  constructor(
    private readonly managerService: ManagerService,
    private readonly creditorService: CreditorService,
  ) {}

  // ✅ ADD: one helper to prevent turning 409/400 into 500
  private rethrowHttpOr500(err: any, fallbackMessage: string): never {
    // If service threw ConflictException/BadRequestException/etc, keep it
    if (err instanceof HttpException) throw err;

    // Also keep legacy Nest error shapes (some libs throw {status,response})
    if (err?.status && err?.response) throw err;

    // Otherwise wrap unknown into 500
    this.logger.error(fallbackMessage, err?.stack || err);
    throw new InternalServerErrorException(fallbackMessage);
  }

  // ----------------------------------------------------------------
  // -------------------------- USER CRUD ----------------------------
  // ----------------------------------------------------------------

  // --- CREATE MANAGER / USER ---
  @Post('add-user')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'User created.' })
  @ApiBadRequestResponse({ description: 'Invalid input or duplicate email.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiConflictResponse({ description: 'Email already exists.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async create(@Req() req: any, @Body() dto: CreateManagerDto) {
    try {
      const actorUserId = this.resolveUserId(req?.user);
      return await this.managerService.create(dto, actorUserId);
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to create manager'); // ✅ FIX
    }
  }

  // --- GET ALL USERS ---
  @Get('get-users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ description: 'Users fetched.' })
  async findAll() {
    try {
      return await this.managerService.findAll();
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch managers'); // ✅ FIX
    }
  }

  // --- GET ONE USER ---
  @Get('get-manager/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a single manager by ID' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.managerService.findOne(Number(id));
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch manager'); // ✅ FIX
    }
  }

  // --- UPDATE USER ---
  @Patch('update-user/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user details' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateManagerDto,
  ) {
    try {
      const actorUserId = this.resolveUserId(req?.user);
      return await this.managerService.update(Number(id), dto, actorUserId);
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to update user'); // ✅ FIX (keeps 409)
    }
  }

  // --- DELETE USER ---
  @Delete('delete-user/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete user by ID' })
  async remove(@Param('id') id: string) {
    try {
      return await this.managerService.remove(Number(id));
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to delete user'); // ✅ FIX
    }
  }

  // ----------------------------------------------------------------
  // ----------------------- TRENDING & AUDIT ------------------------
  // ----------------------------------------------------------------

  // --- TRENDING ITEMS ---
  @Get('trending-items')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get trending items based on report audit' })
  async getTrendingItems(
    @Query('limit') limit: number = 5,
    @Query('days') days: number = 7,
  ) {
    try {
      return await this.managerService.getTrendingItems(limit, days);
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch trending items'); // ✅ FIX
    }
  }

  // --- AUDIT LOGS ---
  @Get('audit-logs')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'View audit logs' })
  async getAuditLogs(@Query() query: ManagerAuditLogsQueryDto) {
    try {
      return await this.managerService.getAuditLogs(query);
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch audit logs'); // ✅ FIX
    }
  }

  // ----------------------------------------------------------------
  // ------------------------ CREDITORS CRUD -------------------------
  // ----------------------------------------------------------------

  // CREATE CREDITOR
  @Post('creditors')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a creditor record (credit customer)' })
  @ApiCreatedResponse({ description: 'Creditor created.' })
  @ApiBadRequestResponse({ description: 'Invalid input.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerContact: { type: 'string', example: '+94771234567' },
        totalDue: { type: 'number', example: 1250.0 },
        notes: {
          type: 'string',
          example: 'Carry over from invoice INV-2025-0012',
        },
      },
      required: ['customerContact', 'totalDue'],
    },
  })
  async createCreditor(@Body() dto: CreateCreditorDto) {
    try {
      // If you later add userId in JWT, pass it here
      return await this.creditorService.create(dto /*, userIdFromJwt */);
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to create creditor'); // ✅ FIX
    }
  }

  // LIST CREDITORS (ALL CREDIT CUSTOMERS)
  @Get('creditors')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all credit customers (creditors)' })
  @ApiOkResponse({ description: 'Creditor list fetched.' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async listCreditors(
    @Query('search') search?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset = 0,
  ) {
    try {
      return await this.creditorService.findAll(search, limit, offset);
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch creditors'); // ✅ FIX
    }
  }

  // UPDATE CREDITOR
  @Patch('creditors/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update creditor by ID' })
  @ApiOkResponse({ description: 'Creditor updated.' })
  async updateCreditor(@Param('id') id: string, @Body() dto: UpdateCreditorDto) {
    try {
      return await this.creditorService.update(
        Number(id),
        dto /*, userIdFromJwt */,
      );
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to update creditor'); // ✅ FIX
    }
  }

  // DELETE CREDITOR
  @Delete('creditors/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN') // Keep delete stricter if you want
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete creditor by ID' })
  @ApiOkResponse({ description: 'Creditor deleted.' })
  async deleteCreditor(@Param('id') id: string) {
    try {
      return await this.creditorService.remove(Number(id));
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to delete creditor'); // ✅ FIX
    }
  }

  // ----------------------------------------------------------------
  // ---------------------------- REPORTS ----------------------------
  // ----------------------------------------------------------------

  // --- Items Details ----
  @Get('reports/items')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get items list' })
  @ApiOkResponse({ description: 'Items fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async findAllItems() {
    try {
      return await this.managerService.findAllItems();
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch items'); // ✅ FIX
    }
  }

  // --- Customers Details ----
  @Get('reports/customers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get customers list' })
  @ApiOkResponse({ description: 'Customers fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async findAllCustomers() {
    try {
      return await this.managerService.findAllCustomers();
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch customers'); // ✅ FIX
    }
  }

  // --- User Details ----
  @Get('reports/users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get users list' })
  @ApiOkResponse({ description: 'Users fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async findAllUsers() {
    try {
      return await this.managerService.findAllUsers();
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch users'); // ✅ FIX
    }
  }

  // --- Supplier Details ----
  @Get('reports/suppliers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get suppliers list' })
  @ApiOkResponse({ description: 'Suppliers fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async findAllSuppliers() {
    try {
      return await this.managerService.findAllSuppliers();
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch suppliers'); // ✅ FIX
    }
  }

  // --- Stock Details ----
  @Get('reports/stocks')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get stock list' })
  @ApiOkResponse({ description: 'Stocks fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async findAllStocks() {
    try {
      return await this.managerService.findAllStocks();
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch stocks'); // ✅ FIX
    }
  }

  // --- Invoice Details ----
  @Get('reports/invoices')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get invoice list' })
  @ApiOkResponse({ description: 'Invoices fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async findAllInvoices() {
    try {
      return await this.managerService.findAllInvoices();
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch invoices'); // ✅ FIX
    }
  }

  // --- Card Payment Details ----
  @Get('reports/card-payments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get card payment list' })
  @ApiOkResponse({ description: 'Card payments fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async findAllCardPayments() {
    try {
      return await this.managerService.findAllCardPayments();
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch card payments'); // ✅ FIX
    }
  }

  // --- Cash Payment Details ----
  @Get('reports/cash-payments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get cash payment list' })
  @ApiOkResponse({ description: 'Cash payments fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async findAllCashPayments() {
    try {
      return await this.managerService.findAllCashPayments();
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch cash payments'); // ✅ FIX
    }
  }

  // --- Daily Sales Report ----
  @Get('reports/daily-sales')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get daily sales report' })
  @ApiOkResponse({ description: 'Daily sales report fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async findAllDailySales() {
    try {
      return await this.managerService.findAllDailySales();
    } catch (err: any) {
      this.rethrowHttpOr500(err, 'Failed to fetch daily sales'); // ✅ FIX
    }
  }

  private resolveUserId(user: any): number {
    const candidate = user?.userId ?? user?.sub ?? user?.id;
    const numericId = Number(candidate ?? NaN);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new BadRequestException(
        'Authenticated user id is missing or invalid.',
      );
    }
    return numericId;
  }
}
