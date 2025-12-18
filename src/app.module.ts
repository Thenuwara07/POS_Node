import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StockModule } from './stock/stock.module';
import { ManagerModule } from './manager/manager.module';
import { SupplierModule } from './supplier/supplier.module';
import { InsightModule } from './insights/insight.module';
import { CashierModule } from './cashier/cashier.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    StockModule,
    ManagerModule,
    SupplierModule,
    InsightModule,
    CashierModule
  ],
  controllers: [AppController,HealthController],
  providers: [AppService],
})
export class AppModule {}
