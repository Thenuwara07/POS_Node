import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DiscountReportQueryDto,
  DiscountReportRowDto,
} from '../dto/discount-report.dto';

@Injectable()
export class DiscountReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getDiscountReport(
    query: DiscountReportQueryDto,
    userId?: number,
  ): Promise<DiscountReportRowDto[]> {
    const fromTs = BigInt(query.fromTs);
    const toTs = BigInt(query.toTs);

    // Discount granted = (sum of line totals) - (amount + remain_amount)
    const rows = await this.prisma.$queryRaw<DiscountReportRowDto[]>`
      SELECT
        p.sale_invoice_id AS invoice_no,
        p.discount_type,
        p.discount_value,
        COALESCE(SUM(i.unit_saled_price * i.quantity), 0) AS sale_total,
        (p.amount + p.remain_amount) AS final_total,
        COALESCE(SUM(i.unit_saled_price * i.quantity), 0)
          - (p.amount + p.remain_amount) AS discount_amount,
        p.date
      FROM payment p
      JOIN invoice i
        ON i.sale_invoice_id = p.sale_invoice_id
      WHERE p.sale_invoice_id IS NOT NULL
        AND p.discount_type <> 'NO'              -- only where a discount was applied
        AND p.date BETWEEN ${fromTs} AND ${toTs}
      GROUP BY
        p.sale_invoice_id,
        p.discount_type,
        p.discount_value,
        p.amount,
        p.remain_amount,
        p.date
      ORDER BY p.date DESC, p.sale_invoice_id;
    `;

    if (userId) {
      await this.prisma.reportAudit.create({
        data: {
          reportCode: 'DISCOUNT_GRANTED',
          fromTs,
          toTs,
          query: '',
          userId,
          viewedAt: BigInt(Date.now()),
        },
      });
    }

    return rows;
  }
}
