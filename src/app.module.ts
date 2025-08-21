import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

import { CashierModule } from './cashier/cashier.module';
import { StockModule } from './stock/stock.module';
import { SupplierModule } from './supplier/supplier.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CashierModule,
    StockModule,
    SupplierModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
