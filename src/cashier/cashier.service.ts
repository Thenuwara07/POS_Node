// src/cashier/cashier.service.ts
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryCatalogDto } from './dto/category-catalog.dto';
import { ItemDto } from './dto/item.dto';
import { BatchDto } from './dto/batch.dto';
import { PaymentRecordDto } from './dto/payment-record.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentDiscountType, PaymentMethod, Prisma } from 'generated/prisma';
import { CreateInvoicesDto } from './dto/create-invoices.dto';

@Injectable()
export class CashierService {
  constructor(private readonly prisma: PrismaService) {}


//   -----------------------------------------------------------------------------------------------


// getCategoriesWithItemsAndBatches



  async getCategoriesWithItemsAndBatches(): Promise<CategoryCatalogDto[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { id: 'asc' },
      include: {
        items: {
          orderBy: { id: 'asc' },
          include: {
            stock: {
              where: { quantity: { gt: 0 } },
              orderBy: { id: 'asc' },
            },
          },
        },
      },
    });

    const out: CategoryCatalogDto[] = []; // 
    
    for (const c of categories) {
      const items: ItemDto[] = []; // 

      for (const i of c.items) {
        if (!i.stock || i.stock.length === 0) continue;

        const batches: BatchDto[] = i.stock.map((s) => ({
          batchID: s.batchId,
          pprice: s.unitPrice,
          price: s.sellPrice,
          quantity: s.quantity,
          discountAmount: s.discountAmount,
        })); // ✅ explicitly typed

        const item: ItemDto = {
          id: i.id,
          itemcode: i.barcode ?? null,
          name: i.name,
          colorCode: i.colorCode,
          batches,
        };

        items.push(item);
      }

      if (items.length === 0) continue;

      const category: CategoryCatalogDto = {
        id: c.id,
        category: c.category,
        colorCode: c.colorCode,
        categoryImage: c.categoryImage ?? null,
        items,
      };

      out.push(category);
    }

    return out;
  }



//   -------------------------------------------------------------------------------------------


// Get All Payemnt Records

async getAllPayments(): Promise<PaymentRecordDto[]> {
    const rows = await this.prisma.payment.findMany({
      orderBy: { date: 'desc' }, // newest first
      select: {
        id: true,
        amount: true,
        remainAmount: true,
        date: true,
        fileName: true,
        type: true,
        saleInvoiceId: true,
        userId: true,
        customerContact: true,
        discountType: true,
        discountValue: true,
      },
    });

    // Map Prisma (camelCase/enums/BigInt) -> Flutter (snake_case/strings/number)
    return rows.map((p) => {
      // date is BigInt in Prisma schema -> number (ms epoch)
      const dateNum =
        typeof p.date === 'bigint' ? Number(p.date) : (p.date as unknown as number);

      // Map enums to Flutter strings
      const typeStr = p.type === 'CASH' ? 'Cash' : 'Card';
      const discountStr =
        p.discountType === 'NO'
          ? 'no'
          : p.discountType === 'PERCENTAGE'
          ? 'percentage'
          : 'amount';

      const rec: PaymentRecordDto = {
        id: p.id,
        amount: p.amount,
        remain_amount: p.remainAmount,
        date: dateNum,
        file_name: p.fileName,
        type: typeStr,
        sale_invoice_id: p.saleInvoiceId ?? null,
        user_id: p.userId ?? null,
        customer_contact: p.customerContact ?? null,
        discount_type: discountStr,
        discount_value: p.discountValue,
      };

      return rec;
    });
  }




//   ----------------------------------------------------------------------------------------------





async insertPayment(dto: CreatePaymentDto): Promise<PaymentRecordDto> {
    const typeEnum: PaymentMethod = dto.type === 'Card' ? 'CARD' : 'CASH';
    const discountEnum: PaymentDiscountType =
      dto.discount_type === 'percentage' ? 'PERCENTAGE'
      : dto.discount_type === 'amount' ? 'AMOUNT'
      : 'NO';

    try {
      const created = await this.prisma.payment.create({
        data: {
          amount: dto.amount,
          remainAmount: dto.remain_amount,
          date: BigInt(dto.date),
          fileName: dto.file_name,
          type: typeEnum,
          saleInvoiceId: dto.sale_invoice_id,
          userId: dto.user_id ?? null,
          customerContact: dto.customer_contact ?? null,
          discountType: discountEnum,
          discountValue: dto.discount_value ?? 0,
        },
      });

      return {
        id: created.id,
        amount: created.amount,
        remain_amount: created.remainAmount,
        date: Number(created.date),
        file_name: created.fileName,
        type: created.type === 'CARD' ? 'Card' : 'Cash',
        sale_invoice_id: created.saleInvoiceId ?? null,
        user_id: created.userId ?? null,
        customer_contact: created.customerContact ?? null,
        discount_type:
          created.discountType === 'PERCENTAGE' ? 'percentage'
          : created.discountType === 'AMOUNT' ? 'amount'
          : 'no',
        discount_value: created.discountValue,
      };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        // unique constraint (e.g., sale_invoice_id)
        throw new ConflictException('Duplicate value for unique field');
      }
      if (err?.code === 'P2003') {
        throw new BadRequestException('Invalid relation provided.');
      }
      throw new InternalServerErrorException('Failed to insert payment');
    }
  }

 
//   ----------------------------------------------------------------------------------




async insertInvoices(dto: CreateInvoicesDto): Promise<{ count: number }> {
    const saleId = dto.sale_invoice_id;

    // Ensure payment (FK) exists, like your SQLite FK to payment(sale_invoice_id)
    const payment = await this.prisma.payment.findUnique({
      where: { saleInvoiceId: saleId },
      select: { saleInvoiceId: true },
    });
    if (!payment) {
      throw new NotFoundException(
        `Payment with sale_invoice_id=${saleId} not found`,
      );
    }

    if (!dto.invoices?.length) {
      // No-op, but keep behavior explicit
      return { count: 0 };
    }

    // Validate lines minimally (item_id must be present)
    for (const inv of dto.invoices) {
      if (typeof inv.item_id !== 'number' || Number.isNaN(inv.item_id)) {
        throw new BadRequestException('item_id is required and must be a number');
      }
    }

    try {
      // Use a transaction to mimic "abort on any error"
      const result = await this.prisma.$transaction(async (tx) => {
        const data = dto.invoices.map((inv) => ({
          batchId: inv.batch_id,
          itemId: inv.item_id,
          quantity: inv.quantity,
          unitSaledPrice: inv.unit_saled_price,
          saleInvoiceId: saleId,
        }));

        const r = await tx.invoice.createMany({
          data,
          // skipDuplicates: false  // default; fail if any unique/constraint violation
        });

        return r;
      });

      return { count: result.count };
    } catch (err: any) {
      // Prisma codes: P2003(FK), P2002(unique), P2025(not found), etc.
      if (err?.code === 'P2003') {
        throw new BadRequestException('Invalid relation (FK) while inserting invoices');
      }
      throw new InternalServerErrorException('Failed to insert invoices');
    }
  }



//   -------------------------------------------------------------------------------------------






async getAllReturns(): Promise<Record<string, any>[]> {
    try {
      const rows =
        await this.prisma.$queryRaw<Array<Record<string, any>>>`
          SELECT * FROM "return" ORDER BY created_at DESC
        `;
      return rows;
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch returns');
    }
  }





//   ------------------------------------------------------------------------------------------








async getSaleBundleList(
    saleInvoiceId: string,
  ): Promise<Array<Record<string, any>>> {
    // 1) Payment header
    const p = await this.prisma.payment.findUnique({
      where: { saleInvoiceId },
      select: {
        saleInvoiceId: true,
        amount: true,
        remainAmount: true,
        type: true, // enum: CASH|CARD
        fileName: true,
        date: true, // BigInt in Prisma -> string/number via Number()
        userId: true,
        customerContact: true,
        discountType: true, // enum: NO|PERCENTAGE|AMOUNT
        discountValue: true,
      },
    });

    if (!p) {
      // No such sale_invoice_id
      return [];
    }

    const header: Record<string, any> = {
      sale_invoice_id: p.saleInvoiceId?.toString(),
      payment_amount: Number(p.amount ?? 0),
      payment_remain_amount: Number(p.remainAmount ?? 0),
      payment_type: p.type === 'CARD' ? 'Card' : 'Cash',
      payment_file_name: p.fileName ?? null,
      payment_date:
        typeof p.date === 'bigint'
          ? Number(p.date)
          : Number(p.date ?? 0),
      payment_user_id: p.userId ?? 0,
      customer_contact: p.customerContact ?? null,
      discount_type:
        p.discountType === 'PERCENTAGE'
          ? 'percentage'
          : p.discountType === 'AMOUNT'
          ? 'amount'
          : 'no',
      discount_value: Number(p.discountValue ?? 0),
    };

    // 2) Invoice lines with joins & computed columns
    // Keep SQL aligned with Flutter version
    const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(
      Prisma.sql`
        SELECT
          inv.id               AS invoice_id,
          inv.batch_id         AS batch_id,
          inv.item_id          AS item_id,
          inv.quantity         AS quantity,
          inv.unit_saled_price AS unit_saled_price,
          i.name               AS item_name,
          i.barcode            AS item_barcode,
          s.unit_price         AS unit_price,
          s.sell_price         AS sell_price,
          s.discount_amount    AS discount_amount,
          (COALESCE(s.sell_price, 0) - COALESCE(s.discount_amount, 0))                AS final_unit_price,
          (COALESCE(s.sell_price, 0) - COALESCE(s.discount_amount, 0)) * inv.quantity AS line_total
        FROM "invoice" AS inv
        LEFT JOIN "item"  AS i ON i.id = inv.item_id
        LEFT JOIN "stock" AS s ON s.batch_id = inv.batch_id AND s.item_id = inv.item_id
        WHERE inv.sale_invoice_id = ${saleInvoiceId}
        ORDER BY inv.id ASC
      `,
    );

    const lineMaps = rows.map((r) => {
      const qty = Number(r.quantity ?? 0);
      return {
        invoice_id:
          typeof r.invoice_id === 'number'
            ? r.invoice_id
            : Number(r.invoice_id ?? 0),
        batch_id: r.batch_id?.toString() ?? null,
        item_id:
          typeof r.item_id === 'number'
            ? r.item_id
            : Number(r.item_id ?? 0),
        quantity: Number.isFinite(qty) ? Math.trunc(qty) : 0,
        saled_unit_price: Number(r.unit_saled_price ?? 0),
        item_name: r.item_name?.toString() ?? null,
        item_barcode: r.item_barcode?.toString() ?? null,
        unit_price: Number(r.unit_price ?? 0),
        sell_price: Number(r.sell_price ?? 0),
        discount_amount: Number(r.discount_amount ?? 0),
        final_unit_price: Number(r.final_unit_price ?? 0),
        line_total: Number(r.line_total ?? 0),
      };
    });

    // 3) header first, then lines
    return [header, ...lineMaps];
  }

}
