import { Controller, Get } from '@nestjs/common';
import { CashierService } from './cashier.service';



@Controller('cashier')
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  @Get('/categories')
  async getCategories() {
    return this.cashierService.getCategoriesWithItems();  // Use correct instance
  }
}

