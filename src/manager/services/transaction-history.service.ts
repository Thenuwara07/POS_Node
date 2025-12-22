import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma-client';
import { TransactionHistoryReportQueryDto } from '../dto/transaction-history-report.dto';

const SIMPLE_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class TransactionHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactionHistory(
    query: TransactionHistoryReportQueryDto,
    requestedByUserId?: number,
  ) {
    const { from, to } = this.resolveTimestampRange(query);

    const where: Prisma.PaymentWhereInput = {
      date: {
        gte: from,
        lte: to,
      },
    };


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

  private resolveTimestampRange(
    query: TransactionHistoryReportQueryDto,
  ): { from: bigint; to: bigint } {
    const from = this.parseTimestampValue(query.from, false, 'from');
    const to = this.parseTimestampValue(query.to, true, 'to');

    if (from > to) {
      throw new BadRequestException('`from` must be before or equal to `to`.');
    }

    return { from, to };
  }

  private parseTimestampValue(
    rawValue: string,
    preferEndOfDay: boolean,
    label: 'from' | 'to',
  ): bigint {
    const normalized = rawValue.trim();
    if (!normalized) {
      throw new BadRequestException(`Missing or empty ${label} value.`);
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid ${label} date: ${rawValue}`);
    }

    if (preferEndOfDay && SIMPLE_DATE_ONLY.test(normalized)) {
      return BigInt(
        Date.UTC(
          parsed.getUTCFullYear(),
          parsed.getUTCMonth(),
          parsed.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );
    }

    return BigInt(parsed.getTime());
  }
}
