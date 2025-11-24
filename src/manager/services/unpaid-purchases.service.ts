import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UnpaidPurchasesReportQueryDto,
  UnpaidPurchaseRowDto,
} from '../dto/unpaid-purchases-report.dto';

@Injectable()
export class UnpaidPurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUnpaidPurchasesReport(
    query: UnpaidPurchasesReportQueryDto,
    userId?: number,
  ): Promise<UnpaidPurchaseRowDto[]> {
    const fromTs = BigInt(query.fromTs);
    const toTs = BigInt(query.toTs);

    // Unpaid purchases: supplier requests still PENDING / RESENT
    const rows = await this.prisma.$queryRaw<UnpaidPurchaseRowDto[]>`
      SELECT
        sr.id AS request_id,
        sr.supplier_id,
        s.name AS supplier_name,
        sr.status,
        COALESCE(SUM(sri.unit_price * sri.quantity), 0) AS total_amount,
        sr.created_at AS created_at
      FROM supplier_request sr
      JOIN supplier s
        ON s.id = sr.supplier_id
      JOIN supplier_request_item sri
        ON sri.request_id = sr.id
      WHERE sr.status IN ('PENDING', 'RESENT')
        AND sr.created_at BETWEEN ${fromTs} AND ${toTs}
      GROUP BY
        sr.id,
        sr.supplier_id,
        s.name,
        sr.status,
        sr.created_at
      ORDER BY sr.created_at DESC, sr.id;
    `;

    if (userId) {
      await this.prisma.reportAudit.create({
        data: {
          reportCode: 'UNPAID_PURCHASES',
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
