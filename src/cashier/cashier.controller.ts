// import { Controller, Get } from '@nestjs/common';
// import { CashierService } from './cashier.service';



// @Controller('cashier')
// export class CashierController {
//   constructor(private readonly cashierService: CashierService) {}

//   @Get('/categories')
//   async getCategories() {
//     return this.cashierService.getCategoriesWithItems();  // Use correct instance
//   }
// }


import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CashierService } from './cashier.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Controller('cashier')
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  @Get('categories')
  getCategories() {
    return this.cashierService.getCategoriesWithItemsAndBatches();
  }

  @Get('payments')
  getAllPayments() {
    return this.cashierService.getAllPayments();
  }

  @Post('payments')
  insertPayment(@Body() dto: CreatePaymentDto) {
    return this.cashierService.insertPayment(dto);
  }

  @Post('invoices')
  insertInvoices(
    @Body() body: { saleInvoiceId: string; invoices: CreateInvoiceDto[] },
  ) {
    return this.cashierService.insertInvoices(body);
  }

  @Get('returns')
  getAllReturns() {
    return this.cashierService.getAllReturns();
  }

  @Post('returns')
  insertReturn(@Body() dto: CreateReturnDto) {
    return this.cashierService.insertReturn(dto);
  }

  @Post('update-stock')
  updateStock(@Body() dto: UpdateStockDto) {
    return this.cashierService.updateStock(dto);
  }
}
