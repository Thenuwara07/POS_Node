import { Module } from '@nestjs/common';
import { CreditorsController } from './creditors.controller';
import { CreditorsService } from './creditors.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],       // <-- THIS is the missing piece
  controllers: [CreditorsController],
  providers: [CreditorsService],
  exports: [CreditorsService],
})
export class CreditorsModule {}
