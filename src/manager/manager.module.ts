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
    ReportsService, // <-- NEW
  ],
  exports: [
    CreditorService,
    PromotionService,
    ManagerService,
    ManagerAccountsService,
    MarginsService,
    ReportsService,           // <-- optional export
  ],
})
export class ManagerModule {}
