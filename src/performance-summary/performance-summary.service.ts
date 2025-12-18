import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PerformancePeriod } from './dto/performance-period.enum';
import {
  PerformanceMetricDto,
  PerformanceSummaryDto,
  RangeDto,
} from './dto/performance-summary.dto';

type RangePair = { current: RangeDtoBigInt; previous: RangeDtoBigInt };
type RangeDtoBigInt = { from: bigint; to: bigint };

@Injectable()
export class PerformanceSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(period: PerformancePeriod): Promise<PerformanceSummaryDto> {
    const ranges = this.resolveRanges(period);

    const rows = await this.prisma.$queryRaw<
      { bucket: 'current' | 'previous'; sales: number; transactions: number }[]
    >`
      WITH bounds AS (
        SELECT
          ${ranges.current.from}::bigint AS current_from,
          ${ranges.current.to}::bigint AS current_to,
          ${ranges.previous.from}::bigint AS prev_from,
          ${ranges.previous.to}::bigint AS prev_to
      )
      SELECT 'current' AS bucket,
             COALESCE(SUM(inv."quantity" * inv."unit_saled_price"), 0)::float AS sales,
             COUNT(DISTINCT pay."sale_invoice_id") AS transactions
      FROM "payment" pay
      JOIN "invoice" inv ON inv."sale_invoice_id" = pay."sale_invoice_id"
      WHERE pay."date" BETWEEN (SELECT current_from FROM bounds) AND (SELECT current_to FROM bounds)
      UNION ALL
      SELECT 'previous' AS bucket,
             COALESCE(SUM(inv."quantity" * inv."unit_saled_price"), 0)::float AS sales,
             COUNT(DISTINCT pay."sale_invoice_id") AS transactions
      FROM "payment" pay
      JOIN "invoice" inv ON inv."sale_invoice_id" = pay."sale_invoice_id"
      WHERE pay."date" BETWEEN (SELECT prev_from FROM bounds) AND (SELECT prev_to FROM bounds)
    `;

    const currentRow = rows.find((r) => r.bucket === 'current');
    const previousRow = rows.find((r) => r.bucket === 'previous');

    const currentSales = this.toNumber(currentRow?.sales);
    const previousSales = this.toNumber(previousRow?.sales);
    const currentTx = this.toInt(currentRow?.transactions);
    const previousTx = this.toInt(previousRow?.transactions);

    return {
      period,
      currentRange: this.toRangeDto(ranges.current),
      previousRange: this.toRangeDto(ranges.previous),
      sales: this.buildMetric(currentSales, previousSales),
      transactions: this.buildMetric(currentTx, previousTx),
    };
  }

  private buildMetric(
    current: number,
    previous: number,
  ): PerformanceMetricDto {
    const delta = current - previous;
    const deltaPct = this.percentChange(previous, current);
    return { total: current, delta, deltaPct };
  }

  private percentChange(previous: number, current: number): number | null {
    if (previous === 0) {
      return current === 0 ? 0 : null;
    }
    const pct = ((current - previous) / previous) * 100;
    if (!Number.isFinite(pct)) return null;
    return Math.round(pct * 100) / 100; // 2 decimal places
  }

  private toNumber(v: unknown): number {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  private toInt(v: unknown): number {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }

  private toRangeDto(r: RangeDtoBigInt): RangeDto {
    return { from: Number(r.from), to: Number(r.to) };
  }

  private resolveRanges(period: PerformancePeriod): RangePair {
    const now = new Date();
    const startOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate());

    let currentFrom: Date;
    let currentTo: Date;

    switch (period) {
      case PerformancePeriod.WEEK: {
        const s = startOfDay(new Date());
        s.setDate(s.getDate() - 6);
        currentFrom = s;
        currentTo = now;
        break;
      }
      case PerformancePeriod.MONTH:
        currentFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        currentTo = now;
        break;
      case PerformancePeriod.TODAY:
      default:
        currentFrom = startOfDay(now);
        currentTo = now;
        break;
    }

    const durationMs = currentTo.getTime() - currentFrom.getTime();
    const previousTo = new Date(currentFrom.getTime() - 1);
    const previousFrom = new Date(previousTo.getTime() - durationMs);

    return {
      current: {
        from: BigInt(currentFrom.getTime()),
        to: BigInt(currentTo.getTime()),
      },
      previous: {
        from: BigInt(previousFrom.getTime()),
        to: BigInt(previousTo.getTime()),
      },
    };
  }
}
