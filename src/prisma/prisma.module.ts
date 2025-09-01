import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // optional, but convenient
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // <-- export so other modules can inject it
})
export class PrismaModule {}
