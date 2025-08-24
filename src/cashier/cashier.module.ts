import { Module } from '@nestjs/common';
import { CashierController } from './cashier.controller';
import { CashierService } from './cashier.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [CashierController],
  providers: [CashierService, PrismaService]
})
export class CashierModule {}
