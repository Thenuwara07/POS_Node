import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma-client';
import { TransactionHistoryReportQueryDto } from '../dto/transaction-history-report.dto';

@Injectable()
export class TransactionHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactionHistory(
    query: TransactionHistoryReportQueryDto,
    requestedByUserId?: number,
  ) {
    const { fromTs, toTs, type, userId } = query;

    // Convert query params to numbers/BigInt that match your schema
    const from = BigInt(fromTs);
    const to = BigInt(toTs);

    const where: Prisma.PaymentWhereInput = {
      date: {
        gte: from,
        lte: to,
      },
    };

    if (type) {
      where.type = type;
    }

    if (userId) {
      where.userId = userId;
    }

    const payments = await this.prisma.payment.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // (Optional) audit entry for this report, similar to your other reports
    try {
      await this.prisma.reportAudit.create({
        data: {
          reportCode: 'TRANSACTION_HISTORY',
          fromTs: from,
          toTs: to,
          query: JSON.stringify({
            ...query,
            requestedByUserId,
          }),
          userId: requestedByUserId,
          viewedAt: BigInt(Date.now()),
        },
      });
    } catch (e) {
      // do NOT block main response just because audit failed
      // console.warn('Failed to write transaction history audit', e);
    }

    // Shape data exactly like your UI table: id, ref_no, type, amount, date, user_id
    return payments.map((p) => ({
      id: p.id,
      // front-end can show this as "ref_no"
      ref_no: p.saleInvoiceId ?? p.fileName, // choose which you like
      type: p.type, // CASH / CARD
      amount: p.amount,
      date: p.date, // BigInt epoch ms
      user_id: p.userId,
      cashier_name: p.user?.name ?? null, // extra, if you want
    }));
  }
}
