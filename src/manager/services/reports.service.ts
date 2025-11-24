import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfitMarginReportQueryDto, ProfitMarginRowDto } from '../dto/profit-margin-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfitMarginReport(
    query: ProfitMarginReportQueryDto,
    userId?: number, // optional – used for audit logging
  ): Promise<ProfitMarginRowDto[]> {
    const fromTs = BigInt(query.fromTs ?? ProfitMarginReportQueryDto.defaultFrom());
    const toTs = BigInt(query.toTs ?? ProfitMarginReportQueryDto.defaultTo());

    // Profit = (selling price - cost price) * qty,
    // Margin % = profit / total sales * 100
    const rows = await this.prisma.$queryRaw<ProfitMarginRowDto[]>`
      SELECT
        p.sale_invoice_id AS invoice_no,
        COALESCE(SUM((i.unit_saled_price - s.unit_price) * i.quantity), 0) AS gross_profit,
        CASE
          WHEN COALESCE(SUM(i.unit_saled_price * i.quantity), 0) = 0 THEN 0
          ELSE ROUND(
            (
              COALESCE(SUM((i.unit_saled_price - s.unit_price) * i.quantity), 0)
              / NULLIF(COALESCE(SUM(i.unit_saled_price * i.quantity), 0), 0) * 100
            )::numeric,
            2
          )::float
        END AS margin_pct
      FROM payment p
      JOIN invoice i
        ON i.sale_invoice_id = p.sale_invoice_id
      JOIN stock s
        ON s.item_id = i.item_id
       AND s.batch_id = i.batch_id
      WHERE p.sale_invoice_id IS NOT NULL
        AND p.date BETWEEN ${fromTs} AND ${toTs}
      GROUP BY p.sale_invoice_id
      ORDER BY p.sale_invoice_id;
    `;

    // Optional: write to report_audit table
    if (userId) {
      await this.prisma.reportAudit.create({
        data: {
          reportCode: 'PROFIT_MARGIN',
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
