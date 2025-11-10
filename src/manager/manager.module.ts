import { Module } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CreditorService } from './services/creditor.service';


@Module({
  imports: [PrismaModule],
  controllers: [ManagerController],
  providers: [ManagerService, CreditorService],
  exports: [CreditorService], 
})
export class ManagerModule {}
