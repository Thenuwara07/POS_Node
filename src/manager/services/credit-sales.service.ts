import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreditSalesReportQueryDto,
  CreditSalesRowDto,
} from '../dto/credit-sales-report.dto';

@Injectable()
export class CreditSalesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCreditSalesReport(
    query: CreditSalesReportQueryDto,
    userId?: number,
  ): Promise<CreditSalesRowDto[]> {
    const fromTs = BigInt(query.fromTs);
    const toTs = BigInt(query.toTs);

    // credit sale = payment with remain_amount > 0
    const rows = await this.prisma.$queryRaw<CreditSalesRowDto[]>`
      SELECT
        p.sale_invoice_id AS invoice_no,
        p.customer_contact,
        c.name AS customer_name,
        (p.amount + p.remain_amount) AS total_amount,
        p.amount AS paid_amount,
        p.remain_amount AS credit_amount,
        p.date
      FROM payment p
      LEFT JOIN customer c
        ON c.contact = p.customer_contact
      WHERE p.sale_invoice_id IS NOT NULL
        AND p.remain_amount > 0
        AND p.date BETWEEN ${fromTs} AND ${toTs}
      ORDER BY p.date DESC, p.sale_invoice_id;
    `;

    if (userId) {
      await this.prisma.reportAudit.create({
        data: {
          reportCode: 'CREDIT_SALES',
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
