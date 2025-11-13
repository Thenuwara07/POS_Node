import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarginsQueryDto } from '../dto/margins-query.dto';
import { MarginsResponseDto } from '../dto/margins-response.dto';
import { Prisma } from '../../../generated/prisma';

const DEFAULT_RANGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

@Injectable()
export class MarginsService {
  constructor(private prisma: PrismaService) {}

  private range(dto: MarginsQueryDto) {
    const now = Date.now();
    const fromTs = dto.fromTs ?? (now - DEFAULT_RANGE_MS);
    const toTs = dto.toTs ?? now;
    return { fromTs, toTs };
  }

  async getMargins(dto: MarginsQueryDto, viewerUserId?: number): Promise<MarginsResponseDto> {
    const { fromTs, toTs } = this.range(dto);

    try {
      // ---------- SUMMARY ----------
      const summaryRows: Array<{
        revenue: number | null; cost: number | null;
        items_sold: number | null; tx_count: number | null;
      }> = await this.prisma.$queryRaw(Prisma.sql`
        SELECT
          COALESCE(SUM(i.quantity * i.unit_saled_price), 0) AS revenue,
          COALESCE(SUM(i.quantity * s.unit_price), 0)          AS cost,
          COALESCE(SUM(i.quantity), 0)                         AS items_sold,
          COUNT(DISTINCT p.sale_invoice_id)                    AS tx_count
        FROM invoice i
        JOIN payment p ON p.sale_invoice_id = i.sale_invoice_id
        LEFT JOIN stock s
          ON s.item_id = i.item_id AND s.batch_id = i.batch_id
        WHERE p.date BETWEEN ${fromTs}::bigint AND ${toTs}::bigint
      `);

      const s = summaryRows[0] ?? { revenue: 0, cost: 0, items_sold: 0, tx_count: 0 };
      const revenue = Number(s.revenue ?? 0);
      const cost = Number(s.cost ?? 0);
      const profit = revenue - cost;
      const marginPercent = revenue > 0 ? (profit / revenue) * 100 : 0;

      // ---------- PRODUCTS (breakdown) ----------
      // Optional quick search filter for item or category names
      const qLike = dto.q ? `%${dto.q.toLowerCase()}%` : null;

      const products: Array<{
        item_id: number;
        name: string;
        category: string | null;
        sold: number;
        revenue: number;
        cost: number;
      }> = await this.prisma.$queryRaw(Prisma.sql`
        SELECT
          i.item_id,
          it.name,
          c.category,
          COALESCE(SUM(i.quantity), 0)                              AS sold,
          COALESCE(SUM(i.quantity * i.unit_saled_price), 0)         AS revenue,
          COALESCE(SUM(i.quantity * s.unit_price), 0)               AS cost
        FROM invoice i
        JOIN payment p ON p.sale_invoice_id = i.sale_invoice_id
        JOIN item it    ON it.id = i.item_id
        LEFT JOIN category c ON c.id = it.category_id
        LEFT JOIN stock s
          ON s.item_id = i.item_id AND s.batch_id = i.batch_id
        WHERE p.date BETWEEN ${fromTs}::bigint AND ${toTs}::bigint
          ${qLike ? Prisma.sql`AND (LOWER(it.name) LIKE ${qLike} OR LOWER(c.category) LIKE ${qLike})` : Prisma.empty}
        GROUP BY i.item_id, it.name, c.category
        ORDER BY revenue DESC
        OFFSET ${dto.skip ?? 0}
        LIMIT ${dto.take ?? 50}
      `);

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

      // ---------- Audit (optional but useful) ----------
      await this.prisma.reportAudit.create({
        data: {
          reportCode: 'MANAGER_MARGIN',
          fromTs: BigInt(fromTs),
          toTs: BigInt(toTs),
          query: dto.q ?? undefined,
          userId: viewerUserId ?? null,
          viewedAt: BigInt(Date.now()),
        },
      }).catch(() => void 0); // non-blocking

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
