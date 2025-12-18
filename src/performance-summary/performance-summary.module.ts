import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PerformanceSummaryController } from './performance-summary.controller';
import { PerformanceSummaryService } from './performance-summary.service';

@Module({
  imports: [PrismaModule],
  controllers: [PerformanceSummaryController],
  providers: [PerformanceSummaryService],
})
export class PerformanceSummaryModule {}
