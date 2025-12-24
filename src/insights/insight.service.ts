// insight.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InsightPeriod } from './dto/insight-period.enum';
import { SalesHeaderDto } from './dto/sales-header.dto';
import { TopItemSummaryDto } from './dto/top-item-summary.dto';
import { ChartSeriesDto } from './dto/chart-series.dto';

type Range = { fromMs: bigint; toMs: bigint };

@Injectable()
export class InsightService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- public API ----------

  async salesHeader(
    stockkeeperId: number,
    period?: InsightPeriod,
    fromIso?: string,
    toIso?: string,
  ): Promise<SalesHeaderDto> {
    const r = this.resolveRange(period, fromIso, toIso);

    // Join invoices -> payments, then aggregate
    const rows = await this.prisma.$queryRaw<
      { total_sales: number; customers: number; products: number }[]
    >`
      SELECT
        COALESCE(SUM(inv.quantity * inv.unit_saled_price), 0)::float AS total_sales,
        COUNT(DISTINCT pay.customer_contact)                 AS customers,
        COUNT(DISTINCT inv.item_id)                          AS products
      FROM "invoice" inv
      JOIN "payment" pay
        ON pay."sale_invoice_id" = inv."sale_invoice_id"
      WHERE pay."user_id" = ${stockkeeperId}
        AND pay."date" >= ${r.fromMs} 
        AND pay."date" <= ${r.toMs}
    `;

    const row = rows[0] ?? { total_sales: 0, customers: 0, products: 0 };

    await this.audit('INSIGHT_HEADER', r, stockkeeperId);

    return {
      totalSales: row.total_sales || 0,
      customers: Number(row.customers || 0),
      products: Number(row.products || 0),
    };
  }

  async topItems(
    stockkeeperId: number,
    period?: InsightPeriod,
    fromIso?: string,
    toIso?: string,
    limit = 10,
  ): Promise<TopItemSummaryDto[]> {
    const r = this.resolveRange(period, fromIso, toIso);
    if (limit <= 0) limit = 10;

    const rows = await this.prisma.$queryRaw<
      { item_id: number; name: string; sold: number; avg_price: number }[]
    >`
      SELECT
        it."id" AS item_id,
        it."name" AS name,
        SUM(inv."quantity")::int AS sold,
        COALESCE(AVG(inv."unit_saled_price"), 0)::float AS avg_price
      FROM "invoice" inv
      JOIN "payment" pay
        ON pay."sale_invoice_id" = inv."sale_invoice_id"
      JOIN "item" it
        ON it."id" = inv."item_id"
      WHERE pay."user_id" = ${stockkeeperId}
        AND pay."date" >= ${r.fromMs} 
        AND pay."date" <= ${r.toMs}
      GROUP BY it."id", it."name"
      ORDER BY sold DESC, item_id ASC
      LIMIT ${limit}
    `;

    await this.audit('INSIGHT_TOP_ITEMS', r, stockkeeperId);

    return rows.map((r) => ({
      itemId: r.item_id,
      name: r.name,
      sold: Number(r.sold || 0),
      price: r.avg_price || 0,
    }));
  }

  async salesTrend(
    stockkeeperId: number,
    period?: InsightPeriod,
    fromIso?: string,
    toIso?: string,
  ): Promise<ChartSeriesDto[]> {
    const r = this.resolveRange(period, fromIso, toIso);

    // Date bucket on payment.date (bigint ms) -> day
    const rows = await this.prisma.$queryRaw<
      { day: string; total: number }[]
    >`
      SELECT
        TO_CHAR(to_timestamp(pay."date" / 1000), 'YYYY-MM-DD') AS day,
        COALESCE(SUM(inv."quantity" * inv."unit_saled_price"), 0)::float AS total
      FROM "invoice" inv
      JOIN "payment" pay
        ON pay."sale_invoice_id" = inv."sale_invoice_id"
      WHERE pay."user_id" = ${stockkeeperId}
        AND pay."date" >= ${r.fromMs} 
        AND pay."date" <= ${r.toMs}
      GROUP BY TO_CHAR(to_timestamp(pay."date" / 1000), 'YYYY-MM-DD')
      ORDER BY day ASC
    `;

    await this.audit('INSIGHT_SALES_TREND', r, stockkeeperId);

    // Map to ChartSeriesDto with proper label formatting
    return rows.map((r) => {
      const date = new Date(r.day);
      return {
        day: r.day,
        label: this.formatDateLabel(date, period),
        total: r.total || 0,
      };
    });
  }

  // ---------- helpers ----------

  private resolveRange(
    period?: InsightPeriod,
    fromIso?: string,
    toIso?: string,
  ): Range {
    // If custom range provided, use it.
    if (fromIso && toIso) {
      const fromMs = this.isoToEpochMs(fromIso);
      const toMs = this.isoToEpochMs(toIso);
      if (fromMs > toMs) {
        throw new BadRequestException('from must be <= to');
      }
      return { fromMs, toMs };
    }

    const now = new Date();
    const startOfDay = (d: Date) => {
      const copy = new Date(d);
      copy.setHours(0, 0, 0, 0);
      return copy;
    };
    const endOfDay = (d: Date) => {
      const copy = new Date(d);
      copy.setHours(23, 59, 59, 999);
      return copy;
    };

    let fromDate: Date;
    let toDate: Date;

    switch (period) {
      case InsightPeriod.TODAY:
        fromDate = startOfDay(now);
        toDate = now; // Up to current moment
        break;
      
      case InsightPeriod.LAST_7_DAYS: {
        // Last 7 days including today
        const start = startOfDay(now);
        start.setDate(start.getDate() - 6);
        fromDate = start;
        toDate = endOfDay(now); // Include full today
        break;
      }
      
      case InsightPeriod.LAST_30_DAYS: {
        // Last 30 days including today
        const start = startOfDay(now);
        start.setDate(start.getDate() - 29);
        fromDate = start;
        toDate = endOfDay(now); // Include full today
        break;
      }
      
      case InsightPeriod.THIS_MONTH:
        // From start of current month to now
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        toDate = endOfDay(now); // Include full today
        break;
      
      case InsightPeriod.CUSTOM:
      default:
        // Default fallback to last 7 days
        const start = startOfDay(now);
        start.setDate(start.getDate() - 6);
        fromDate = start;
        toDate = endOfDay(now);
        break;
    }

    return { 
      fromMs: this.dateToEpochMs(fromDate), 
      toMs: this.dateToEpochMs(toDate) 
    };
  }

  private formatDateLabel(date: Date, period?: InsightPeriod): string {
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    
    // For TODAY, show hours if multiple data points
    if (period === InsightPeriod.TODAY) {
      const hours = date.getHours();
      return `${hours}:00`;
    }
    
    // For 7 days, show day + short month
    if (period === InsightPeriod.LAST_7_DAYS) {
      return `${day} ${month}`;
    }
    
    // For 30 days or month, show day + month
    return `${day} ${month}`;
  }

  private dateToEpochMs(d: Date): bigint {
    return BigInt(d.getTime());
  }

  private isoToEpochMs(iso: string): bigint {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) {
      throw new BadRequestException(`Invalid ISO date: ${iso}`);
    }
    return BigInt(t);
  }

  private async audit(code: string, r: Range, userId?: number) {
    try {
      await this.prisma.reportAudit.create({
        data: {
          reportCode: code,
          fromTs: r.fromMs,
          toTs: r.toMs,
          query: null,
          userId: userId ?? null,
          viewedAt: BigInt(Date.now()),
        },
      });
    } catch {
      // don't block the main response on audit errors
    }
  }
}