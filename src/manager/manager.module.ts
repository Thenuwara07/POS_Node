// src/manager/manager.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';

import { PromotionsController } from './promotions.controller';
import { PromotionService } from './services/promotion.service';

import { CreditorService } from './services/creditor.service';

// NEW: Accounts controller & service
import { ManagerAccountsController } from './user-management.controller';
import { ManagerAccountsService } from './services/manager-accounts.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ManagerController,          // existing manager endpoints
    PromotionsController,       // promotions endpoints
    ManagerAccountsController,  // NEW: /manager/accounts/*
  ],
  providers: [
    ManagerService,
    PromotionService,
    CreditorService,
    ManagerAccountsService,     // NEW
  ],
  exports: [
    CreditorService,
    PromotionService,
    ManagerService,
    ManagerAccountsService,     // NEW (export if other modules need it)
  ],
})
export class ManagerModule {}
