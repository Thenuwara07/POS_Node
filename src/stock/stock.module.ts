import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadModule } from '../common/upload/upload.module';

@Module({
  imports: [ UploadModule],
  controllers: [StockController],
  providers: [PrismaService, StockService],
})
export class StockModule {}
