import { Module } from '@nestjs/common';
import { InsightController } from './insight.controller';
import { InsightService } from './insight.service';
import { PrismaService } from 'src/prisma/prisma.service'; // Ensure the path is correct

@Module({
  controllers: [InsightController],
  providers: [InsightService, PrismaService],
})
export class InsightModule {}
