import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [StockController],
  providers: [PrismaService, StockService],
})
export class StockModule {}
