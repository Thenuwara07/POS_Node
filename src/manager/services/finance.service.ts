import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getTotalCashSales(): Promise<number> {
    const { fromTs, toTs } = this.todayRange();
    const result = await this.prisma.payment.aggregate({
      _sum: { cashAmount: true },
      where: {
        date: {
          gte: BigInt(fromTs),
          lte: BigInt(toTs),
        },
      },
    });
    return Number(result._sum.cashAmount ?? 0);
  }

  async getTotalCardSales(): Promise<number> {
    const { fromTs, toTs } = this.todayRange();
    const result = await this.prisma.payment.aggregate({
      _sum: { cardAmount: true },
      where: {
        date: {
          gte: BigInt(fromTs),
          lte: BigInt(toTs),
        },
      },
    });
    return Number(result._sum.cardAmount ?? 0);
  }

  private todayRange() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { fromTs: startOfDay.getTime(), toTs: now.getTime() };
  }
}
