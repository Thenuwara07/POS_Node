import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // adjust path

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  ok() {
    return { ok: true };
  }

  @Get('db')
  async db() {
    const r = await this.prisma.$queryRaw`SELECT 1 as one`;
    return { ok: true, db: r };
  }
}
