import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma-client';
import { PrismaService } from '../../prisma/prisma.service';
import { MarginsQueryDto } from '../dto/margins-query.dto';
import { MarginsResponseDto } from '../dto/margins-response.dto';
import { ProfitPeriod } from '../dto/profit-period.enum';

const DEFAULT_RANGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

@Injectable()
export class MarginsService {
  constructor(private prisma: PrismaService) {}

  private range(dto: MarginsQueryDto) {
    const now = new Date();
    const fromExplicit = this.toOptionalNumber(dto.fromTs);
    const toExplicit = this.toOptionalNumber(dto.toTs);

    if (fromExplicit !== undefined || toExplicit !== undefined) {
      const toTs = toExplicit ?? now.getTime();
      const fromTs =
        fromExplicit ?? Math.max(0, toTs - DEFAULT_RANGE_MS);
      return { fromTs, toTs };
    }

    if (dto.period) {
      return this.rangeForPeriod(dto.period, now);
    }

    return {
      fromTs: now.getTime() - DEFAULT_RANGE_MS,
      toTs: now.getTime(),
    };
  }

  private rangeForPeriod(period: ProfitPeriod, now: Date) {
    const startOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate());

    let from: Date;
    let to: Date;

    switch (period) {
      case ProfitPeriod.ALL_TIME:
        return { fromTs: 0, toTs: now.getTime() };
      case ProfitPeriod.TODAY:
        from = startOfDay(now);
        to = now;
        break;
      case ProfitPeriod.WEEK: {
        const s = startOfDay(new Date(now));
        s.setDate(s.getDate() - 6);
        from = s;
        to = now;
        break;
      }
      case ProfitPeriod.MONTH:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = now;
        break;
      case ProfitPeriod.YEAR:
        from = new Date(now.getFullYear(), 0, 1);
        to = now;
        break;
      default:
        return {
          fromTs: now.getTime() - DEFAULT_RANGE_MS,
          toTs: now.getTime(),
        };
    }

    return { fromTs: from.getTime(), toTs: to.getTime() };
  }

  private toOptionalNumber(value: unknown): number | undefined {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  async getMargins(
    dto: MarginsQueryDto,
    viewerUserId?: number,
  ): Promise<MarginsResponseDto> {
    const { fromTs, toTs } = this.range(dto);

    try {
      // ---------- SUMMARY ----------
      const summaryRows = await this.prisma.$queryRaw<
        Array<{
          revenue: bigint | number | null;
          cost: bigint | number | null;
          items_sold: bigint | number | null;
          tx_count: bigint | number | null;
        }>
      >`
        SELECT
          COALESCE(SUM(i.quantity * i.unit_saled_price), 0) AS revenue,
          COALESCE(SUM(i.quantity * s.unit_price), 0)       AS cost,
          COALESCE(SUM(i.quantity), 0)                      AS items_sold,
          COUNT(DISTINCT p.sale_invoice_id)                 AS tx_count
        FROM invoice i
        JOIN payment p ON p.sale_invoice_id = i.sale_invoice_id
        LEFT JOIN stock s
          ON s.item_id = i.item_id AND s.batch_id = i.batch_id
        WHERE p.date BETWEEN ${fromTs}::bigint AND ${toTs}::bigint
      `;

      const s =
        summaryRows[0] ?? {
          revenue: 0,
          cost: 0,
          items_sold: 0,
          tx_count: 0,
        };

      const revenue = Number(s.revenue ?? 0);
      const cost = Number(s.cost ?? 0);
      const profit = revenue - cost;
      const marginPercent = revenue > 0 ? (profit / revenue) * 100 : 0;

      // ---------- PRODUCTS (breakdown) ----------
      const qLike = dto.q ? `%${dto.q.toLowerCase()}%` : null;

      const whereClauses: Prisma.Sql[] = [];
      if (qLike) {
        whereClauses.push(
          Prisma.sql`(LOWER(it.name) LIKE ${qLike} OR LOWER(c.category) LIKE ${qLike})`,
        );
      }
      const whereSql = whereClauses.length
        ? Prisma.sql`WHERE ${Prisma.join(whereClauses, ' AND ')}`
        : Prisma.sql``;

      const fromTsSql = Prisma.sql`${fromTs}::bigint`;
      const toTsSql = Prisma.sql`${toTs}::bigint`;

      const base = Prisma.sql`
        WITH sales AS (
          SELECT
            i.item_id,
            COALESCE(SUM(i.quantity), 0)                      AS sold,
            COALESCE(SUM(i.quantity * i.unit_saled_price), 0) AS revenue,
            COALESCE(SUM(i.quantity * s.unit_price), 0)       AS cost
          FROM invoice i
          JOIN payment p ON p.sale_invoice_id = i.sale_invoice_id
          LEFT JOIN stock s
            ON s.item_id = i.item_id AND s.batch_id = i.batch_id
          WHERE p.date BETWEEN ${fromTsSql} AND ${toTsSql}
          GROUP BY i.item_id
        )
        SELECT
          it.id AS item_id,
          it.name,
          c.category,
          COALESCE(sales.sold, 0)    AS sold,
          COALESCE(sales.revenue, 0) AS revenue,
          COALESCE(sales.cost, 0)    AS cost
        FROM item it
        LEFT JOIN category c ON c.id = it.category_id
        LEFT JOIN sales ON sales.item_id = it.id
        ${whereSql}
        ORDER BY revenue DESC, it.id ASC
      `;

      const skipValue = Number(dto.skip);
      const takeValue = Number(dto.take);
      const skip = Number.isFinite(skipValue)
        ? Math.max(0, Math.trunc(skipValue))
        : undefined;
      const take = Number.isFinite(takeValue)
        ? Math.max(1, Math.trunc(takeValue))
        : undefined;

      let products: Array<{
        item_id: number | bigint;
        name: string;
        category: string | null;
        sold: number | bigint | null;
        revenue: number | bigint | null;
        cost: number | bigint | null;
      }>;

      if (take != null && skip != null) {
        products = await this.prisma.$queryRaw<
          Array<{
            item_id: number | bigint;
            name: string;
            category: string | null;
            sold: number | bigint | null;
            revenue: number | bigint | null;
            cost: number | bigint | null;
          }>
        >(Prisma.sql`${base} LIMIT ${take} OFFSET ${skip}`);
      } else if (take != null) {
        products = await this.prisma.$queryRaw<
          Array<{
            item_id: number | bigint;
            name: string;
            category: string | null;
            sold: number | bigint | null;
            revenue: number | bigint | null;
            cost: number | bigint | null;
          }>
        >(Prisma.sql`${base} LIMIT ${take}`);
      } else if (skip != null) {
        products = await this.prisma.$queryRaw<
          Array<{
            item_id: number | bigint;
            name: string;
            category: string | null;
            sold: number | bigint | null;
            revenue: number | bigint | null;
            cost: number | bigint | null;
          }>
        >(Prisma.sql`${base} OFFSET ${skip}`);
      } else {
        products = await this.prisma.$queryRaw<
          Array<{
            item_id: number | bigint;
            name: string;
            category: string | null;
            sold: number | bigint | null;
            revenue: number | bigint | null;
            cost: number | bigint | null;
          }>
        >(base);
      }

      const productDtos = products.map((r) => {
        const revenue = Number(r.revenue ?? 0);
        const cost = Number(r.cost ?? 0);
        const profit = revenue - cost;
        const marginPercent = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          itemId: Number(r.item_id),
          name: r.name,
          category: r.category,
          sold: Number(r.sold ?? 0),
          revenue,
          cost,
          profit,
          marginPercent: Number(marginPercent.toFixed(2)),
        };
      });

      // ---------- Audit (non-blocking) ----------
      this.prisma.reportAudit
        .create({
          data: {
            reportCode: 'MANAGER_MARGIN',
            fromTs: BigInt(fromTs),
            toTs: BigInt(toTs),
            query: dto.q ?? undefined,
            userId: viewerUserId ?? null,
            viewedAt: BigInt(Date.now()),
          },
        })
        .catch(() => void 0);

      return {
        summary: {
          revenue,
          cost,
          profit,
          marginPercent: Number(marginPercent.toFixed(2)),
          itemsSold: Number(s.items_sold ?? 0),
          transactions: Number(s.tx_count ?? 0),
        },
        products: productDtos,
      };
    } catch (e) {
      throw new InternalServerErrorException('Failed to calculate margins');
    }
  }
}
