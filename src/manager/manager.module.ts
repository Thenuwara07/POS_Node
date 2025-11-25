// src/manager/manager.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';

import { PromotionsController } from './promotions.controller';
import { PromotionService } from './services/promotion.service';

import { CreditorService } from './services/creditor.service';

// Accounts (existing)
import { ManagerAccountsController } from './user-management.controller';
import { ManagerAccountsService } from './services/manager-accounts.service';

// --- Margins (NEW) ---
import { ManagerMarginsController } from './margins.controller';
import { MarginsService } from './services/margins.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './services/reports.service';
import { CreditSalesService } from './services/credit-sales.service';
import { DiscountReportService } from './services/discount-report.service';
import { UnpaidPurchasesService } from './services/unpaid-purchases.service';
import { TransactionHistoryService } from './services/transaction-history.service';
import { RefundBillsService } from './services/refund-bills.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ManagerController,
    PromotionsController,
    ManagerAccountsController,
    ManagerMarginsController,
    ReportsController, // <-- NEW
  ],
  providers: [
    ManagerService,
    PromotionService,
    CreditorService,
    ManagerAccountsService,
    MarginsService,  
    ReportsService,
    CreditSalesService,
    DiscountReportService,
    UnpaidPurchasesService,
    TransactionHistoryService,
    RefundBillsService,
  ],
  exports: [
    CreditorService,
    PromotionService,
    ManagerService,
    ManagerAccountsService,
    MarginsService,
    ReportsService,
    CreditSalesService,
    DiscountReportService,
    UnpaidPurchasesService,
    TransactionHistoryService,
    RefundBillsService,
  ],
})
export class ManagerModule {}
