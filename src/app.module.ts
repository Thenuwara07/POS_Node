import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

import { CashierModule } from './cashier/cashier.module';
import { StockModule } from './stock/stock.module';

import { UsersModule } from './users/users.module';
import { SupplierModule } from './supplier/supplier.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CashierModule,
    StockModule,
     UsersModule,
    SupplierModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
