import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma-client';
import { RefundBillsReportQueryDto } from '../dto/refund-bills-report.dto';

@Injectable()
export class RefundBillsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRefundBillsReport(
    query: RefundBillsReportQueryDto,
    requestedByUserId?: number,
  ) {
    const { fromTs, toTs, userId } = query;

    const from = BigInt(fromTs);
    const to = BigInt(toTs);

    const where: Prisma.PaymentWhereInput = {
      date: {
        gte: from,
        lte: to,
      },
      // 👇 assume refunds are negative payments
      amount: {
        lt: 0,
      },
    };

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

    // optional audit log (same style as other reports)
    try {
      await this.prisma.reportAudit.create({
        data: {
          reportCode: 'REFUND_BILLS',
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
      // do not break main response on audit failure
    }

    // Shape results for the UI (simple table)
    return payments.map((p) => ({
      id: p.id,
      ref_no: p.saleInvoiceId ?? p.fileName, // pick one you prefer
      amount: p.amount,
      date: p.date, // BigInt epoch ms (frontend already handles)
      user_id: p.userId,
      cashier_name: p.user?.name ?? null,
    }));
  }
}
