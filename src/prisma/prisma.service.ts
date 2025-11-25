import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// ✅ MUST MATCH prisma.schema output EXACTLY:
import { PrismaClient } from '../../generated/prisma-client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  constructor() {
    // ✅ Enable expanded logging if you want
    super({
      log: [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
