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
import { ReturnRichDto } from './dto/return-rich.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import { UpdateReturnDoneDto } from './dto/update-return-done.dto';

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





// Get Sale Bundle List


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




  // ---------------------------------------------------------------------------------




  // -------------------- returns (rich) --------------------
  
  
  
  
  async getReturnsRich(): Promise<ReturnRichDto[]> {
    try {
      const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        SELECT
          r.id            AS return_id,
          r.batch_id      AS batch_id,
          r.quantity      AS quantity,
          r.unit_saled_price AS unit_saled_price,
          r.sale_invoice_id  AS sale_invoice_id,
          r.created_at    AS created_at,

          u.id            AS user_id,
          u.name          AS user_name,
          u.email         AS user_email,
          u.color_code    AS user_color_code,

          i.id            AS item_id,
          i.name          AS item_name,
          i.barcode       AS item_barcode,
          i.color_code    AS item_color_code
        FROM "return" r
        JOIN "user"  u ON u.id = r.user_id
        JOIN "item"  i ON i.id = r.item_id
        ORDER BY r.created_at DESC, r.id DESC
      `);

      const out: ReturnRichDto[] = rows.map((row) => {
        // created_at might be BIGINT/number/string -> coerce to number for Flutter
        const createdAt =
          typeof row.created_at === 'bigint'
            ? Number(row.created_at)
            : typeof row.created_at === 'string'
            ? Number(row.created_at)
            : (row.created_at as number);

        return {
          id: Number(row.return_id),
          user: {
            id: Number(row.user_id),
            name: String(row.user_name),
            email: String(row.user_email),
            color_code: String(row.user_color_code),
          },
          batch_id: String(row.batch_id),
          item: {
            id: Number(row.item_id),
            name: String(row.item_name),
            barcode: row.item_barcode == null ? null : String(row.item_barcode),
            color_code: String(row.item_color_code),
          },
          quantity: Number(row.quantity),
          unit_saled_price: Number(row.unit_saled_price),
          sale_invoice_id:
            row.sale_invoice_id == null ? null : String(row.sale_invoice_id),
          created_at: createdAt,
        };
      });

      return out;
    } catch (err) {
      // You can branch on Prisma error codes if needed:
      // if ((err as PrismaClientKnownRequestError).code === 'PXXXX') { ... }
      throw new InternalServerErrorException('Failed to fetch returns (rich).');
    }
  }








  // ------------------------------------------------------------------------------------------------


  // INSERT RETURN 


  async insertReturn(dto: CreateReturnDto): Promise<{ id: number }> {
    // ---- Coercions / validations (server-side, mirrors Flutter) ----
    const userId = Number(dto.user_id);
    const batchId = String(dto.batch_id ?? '').trim();
    const itemId = Number(dto.item_id);
    const quantity = Number(dto.quantity);
    const unitSaledPrice = Number(dto.unit_saled_price);
    const saleInvoiceId = String(dto.sale_invoice_id ?? '').trim();

    // created_at: accept int millis or ISO-8601 string; otherwise now()
    let createdAtMs: number;
    const createdRaw = dto.created_at;
    if (typeof createdRaw === 'number') {
      createdAtMs = createdRaw;
    } else if (typeof createdRaw === 'string') {
      const parsed = Date.parse(createdRaw);
      if (Number.isNaN(parsed)) {
        throw new BadRequestException('created_at string is not a valid date');
      }
      createdAtMs = parsed;
    } else {
      createdAtMs = Date.now();
    }

    if (!Number.isFinite(userId) || userId <= 0) {
      throw new BadRequestException('user_id is required and must be > 0');
    }
    if (!batchId) throw new BadRequestException('batch_id is required and must be non-empty');
    if (!Number.isFinite(itemId) || itemId <= 0) {
      throw new BadRequestException('item_id is required and must be > 0');
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new BadRequestException('quantity must be >= 1');
    }
    if (!Number.isFinite(unitSaledPrice) || unitSaledPrice < 0) {
      throw new BadRequestException('unit_saled_price must be >= 0');
    }
    if (!saleInvoiceId) {
      throw new BadRequestException('sale_invoice_id is required and must be non-empty');
    }

    // ---- Insert using raw SQL (no Prisma model for "return") ----
    try {
      const castBigInt = Prisma.sql`${createdAtMs}::bigint`;
      const rows = await this.prisma.$queryRaw<Array<{ id: number }>>(Prisma.sql`
        INSERT INTO "return" 
          ("user_id","batch_id","item_id","quantity","unit_saled_price","sale_invoice_id","created_at")
        VALUES 
          (${userId}, ${batchId}, ${itemId}, ${quantity}, ${unitSaledPrice}, ${saleInvoiceId}, ${castBigInt})
        RETURNING id
      `);

      const created = rows?.[0];
      if (!created || typeof created.id !== 'number') {
        throw new InternalServerErrorException('Return insert did not yield an id');
      }
      return { id: created.id };
    } catch (err: any) {
      // Prisma error mapping (raw queries may not always carry codes, but handle known cases)
      const code = (err as PrismaClientKnownRequestError)?.code;
      if (code === 'P2003') {
        // FK violation (e.g., user_id/item_id/sale_invoice_id not matching)
        throw new BadRequestException('Invalid relation (FK) while inserting return');
      }
      if (code === 'P2002') {
        // unique violation (if any unique constraints exist on the table)
        throw new ConflictException('Duplicate value for unique field on return');
      }
      throw new InternalServerErrorException('Failed to insert return');
    }
  }






  // ----------------------------------------------------------------------------------------



  // DELETE FROM "return" WHERE id = :id
   
  
  async deleteReturn(id: number): Promise<{ deleted: number }> {
    const rid = Number(id);
    if (!Number.isInteger(rid) || rid <= 0) {
      throw new BadRequestException('id must be a positive integer');
    }

    try {
      // In Postgres, $executeRaw returns the number of affected rows.
      const affected = await this.prisma.$executeRaw(
        Prisma.sql`DELETE FROM "return" WHERE id = ${rid}`
      );

      if (!affected) {
        throw new NotFoundException(`Return id=${rid} not found`);
      }
      return { deleted: affected }; // typically 1
    } catch (err) {
      throw new InternalServerErrorException('Failed to delete return');
    }
  }



  // --------------------------------------------------------------------------------------------------



  

  // PATCH "return".is_done by id
  async toggleReturnDone(id: number, dto: UpdateReturnDoneDto): Promise<{ updated: number }> {
    const rid = Number(id);
    if (!Number.isInteger(rid) || rid <= 0) {
      throw new BadRequestException('id must be a positive integer');
    }

    // Convert boolean -> 0/1 to match your schema
    const flag = dto.is_done ? 1 : 0;

    try {
      const affected = await this.prisma.$executeRaw(
        Prisma.sql`UPDATE "return" SET is_done = ${flag} WHERE id = ${rid}`
      );

      if (!affected) {
        throw new NotFoundException(`Return id=${rid} not found`);
      }
      return { updated: affected }; // typically 1
    } catch (err) {
      throw new InternalServerErrorException('Failed to update is_done');
    }
  }
  





  // --------------------------------------------------------------------------------



  // DELETE FROM "return";  -> returns how many rows were removed
  async clearAllReturns(): Promise<{ deleted: number }> {
    try {
      const affected = await this.prisma.$executeRaw(
        Prisma.sql`DELETE FROM "return"`
      );
      return { deleted: affected }; // e.g., 0..N
    } catch {
      throw new InternalServerErrorException('Failed to clear returns');
    }
  }


  // -------------------------------------------------------------------------------





  // SELECT * FROM "drawer" WHERE user_id = ? ORDER BY date DESC
  async getDrawerByUser(userId: number): Promise<Record<string, any>[]> {
    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) {
      throw new BadRequestException('userId must be a positive integer');
    }

    try {
      const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        SELECT * FROM "drawer"
        WHERE user_id = ${uid}
        ORDER BY date DESC
      `);

      // Ensure JSON-safe output (Postgres BIGINT -> number)
      return rows.map((r) => {
        const out: Record<string, any> = {};
        for (const k of Object.keys(r)) {
          const v = (r as any)[k];
          out[k] = typeof v === 'bigint' ? Number(v) : v;
        }
        return out;
      });
    } catch {
      // Parity with Flutter: swallow errors and return []
      return [];
    }
  }





  // -------------------------------------------------------------------------------------




  // SELECT * FROM "drawer" WHERE user_id = ? [AND date range] ORDER BY date DESC
  async getDrawersByUserId(
    userId: number,
    todayOnly = false,
  ): Promise<Record<string, any>[]> {
    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) {
      throw new BadRequestException('userId must be a positive integer');
    }

    // Optional "today" window (local server time) in epoch-ms
    let startMs: number | null = null;
    let endMs: number | null = null;
    if (todayOnly) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      startMs = start.getTime();
      endMs = end.getTime();
    }

    const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(
      todayOnly
        ? Prisma.sql`
            SELECT * FROM "drawer"
            WHERE user_id = ${uid}
              AND date >= ${Prisma.sql`${startMs}::bigint`}
              AND date <  ${Prisma.sql`${endMs}::bigint`}
            ORDER BY date DESC
          `
        : Prisma.sql`
            SELECT * FROM "drawer"
            WHERE user_id = ${uid}
            ORDER BY date DESC
          `,
    );

    // Convert any bigint fields to number for JSON safety
    return rows.map((r) => {
      const o: Record<string, any> = {};
      for (const k of Object.keys(r)) {
        const v = (r as any)[k];
        o[k] = typeof v === 'bigint' ? Number(v) : v;
        // If your drawer.date is BIGINT, it will now be a JS number.
      }
      return o;
    });
  }


  // --------------------------------------------------------------------------


  

}
