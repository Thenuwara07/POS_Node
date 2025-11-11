import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';

import { PromotionsController } from './promotions.controller';
import { PromotionService } from './services/promotion.service';

import { CreditorService } from './services/creditor.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ManagerController,       // your existing manager endpoints
    PromotionsController,    // promotions endpoints (guarded in controller)
  ],
  providers: [
    ManagerService,
    PromotionService,
    CreditorService,
  ],
  exports: [
    CreditorService,
    PromotionService,
    ManagerService,
  ],
})
export class ManagerModule {}
