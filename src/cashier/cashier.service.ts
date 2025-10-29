// import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';

// @Injectable()
// export class CashierService {
//   constructor(private readonly prisma: PrismaService) {}

//   async getCategoriesWithItems() {
//     const categories = await this.prisma.category.findMany({
//       include: {
//         items: {
//           // only items that have at least one batch with quantity > 0
//           where: {
//             stock: {
//               some: { quantity: { gt: 0 } },
//             },
//           },
//           include: {
//             stock: {
//               where: { quantity: { gt: 0 } }, // only in-stock batches
//               select: {
//                 batchId: true,
//                 unitPrice: true,
//                 sellPrice: true,
//                 quantity: true,
//                 discountAmount: true,
//               },
//               orderBy: { sellPrice: 'asc' }, // optional
//             },
//           },
//           orderBy: { name: 'asc' }, // optional
//         },
//       },
//       orderBy: { id: 'asc' }, // optional
//     });

//     // If you also want to drop categories that end up with zero items, filter here:
//     const nonEmptyCategories = categories.filter((c) => c.items.length > 0);

//     return nonEmptyCategories.map((category) => ({
//       id: category.id,
//       category: category.category,
//       colorCode: category.colorCode,
//       items: category.items.map((item) => ({
//         id: item.id,
//         itemcode: item.barcode,
//         name: item.name,
//         colorCode: item.colorCode,
//         batches: item.stock.map((s) => ({
//           batchID: s.batchId,
//           pprice: s.unitPrice,
//           price: s.sellPrice,
//           quantity: s.quantity,
//           discountAmount: s.discountAmount,
//           // Optional: derived net price if discountAmount is per-unit amount
//           // netPrice: Math.max(s.sellPrice - (s.discountAmount ?? 0), 0),
//         })),
//       })),
//     }));
//   }
// }

// src/cashier/cashier.controller.ts
import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
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
import { CashierService } from './cashier.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

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

  // --- CATEGORIES WITH ITEMS: Get (AUTH REQUIRED) ---
  @Get('categories-with-items')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Cashier')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all categories with items and batches' })
  @ApiOkResponse({ description: 'Categories with items fetched successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async getCategoriesWithItemsAndBatches() {
    try {
      return await this.cashierService.getCategoriesWithItemsAndBatches();
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to fetch categories with items', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch categories with items');
    }
  }

  // --- PAYMENTS: Get All (AUTH REQUIRED) ---
  @Get('payments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Cashier')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all payments' })
  @ApiOkResponse({ description: 'Payments fetched successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async getAllPayments() {
    try {
      return await this.cashierService.getAllPayments();
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to fetch payments', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch payments');
    }
  }

  // --- PAYMENT: Create (AUTH REQUIRED) ---
  @Post('payments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Cashier')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiCreatedResponse({ description: 'Payment created successfully.' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async insertPayment(@Body() dto: CreatePaymentDto) {
    try {
      return await this.cashierService.insertPayment(dto);
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to create payment', err?.stack || err);
      throw new InternalServerErrorException('Failed to create payment');
    }
  }

  // --- INVOICES: Create Batch (AUTH REQUIRED) ---
  @Post('invoices')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Cashier')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create multiple invoices for a sale' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        saleInvoiceId: { type: 'string', example: 'INV-2025-001' },
        invoices: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['saleInvoiceId', 'invoices'],
    },
  })
  @ApiCreatedResponse({ description: 'Invoices created successfully.' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async insertInvoices(
    @Body() payload: { saleInvoiceId: string; invoices: CreateInvoiceDto[] },
  ) {
    try {
      return await this.cashierService.insertInvoices(payload);
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to create invoices', err?.stack || err);
      throw new InternalServerErrorException('Failed to create invoices');
    }
  }

  // --- RETURNS: Get All (AUTH REQUIRED) ---
  @Get('returns')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Cashier')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all returns' })
  @ApiOkResponse({ description: 'Returns fetched successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async getAllReturns() {
    try {
      return await this.cashierService.getAllReturns();
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to fetch returns', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch returns');
    }
  }

  // --- RETURN: Create (AUTH REQUIRED) ---
  @Post('returns')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Cashier')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new return' })
  @ApiBody({ type: CreateReturnDto })
  @ApiCreatedResponse({ description: 'Return created successfully.' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async insertReturn(@Body() dto: CreateReturnDto) {
    try {
      return await this.cashierService.insertReturn(dto);
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to create return', err?.stack || err);
      throw new InternalServerErrorException('Failed to create return');
    }
  }

  // --- STOCK: Update (AUTH REQUIRED) ---
  @Put('stock')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Cashier')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update stock quantity' })
  @ApiBody({ type: UpdateStockDto })
  @ApiOkResponse({ description: 'Stock updated successfully.' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async updateStock(@Body() dto: UpdateStockDto) {
    try {
      return await this.cashierService.updateStock(dto);
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to update stock', err?.stack || err);
      throw new InternalServerErrorException('Failed to update stock');
    }
  }
}

