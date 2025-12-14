import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryCatalogDto } from './dto/category-catalog.dto';
import { ItemDto } from './dto/item.dto';
import { BatchDto } from './dto/batch.dto';
import { PaymentRecordDto } from './dto/payment-record.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateQuickSaleDto } from './dto/create-quick-sale.dto';
import { QuickSaleRecordDto } from './dto/quick-sale-record.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import {
  PaymentDiscountType,
  PaymentMethod,
  Prisma,
} from '../../generated/prisma-client';
import { PrismaClientKnownRequestError } from '../../generated/prisma-client/runtime/library';
import { CreateInvoicesDto } from './dto/create-invoices.dto';
import { ReturnRichDto } from './dto/return-rich.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDoneDto } from './dto/update-return-done.dto';
import { DrawerOrderKey, DrawersQueryDto } from './dto/drawers-query.dto';
import {
  StockApplyMissingDto,
  StockApplyResultDto,
  StockApplyUpdatedDto,
  StockApplyWarnDto,
  UpdateStockFromInvoicesPayloadDto,
} from './dto/stock-apply.dto';
import { QueryDrawersDto } from './dto/query-drawers.dto';
import { InsertDrawerDto } from './dto/insert-drawer.dto';
// import { QueryBillHistoryDto } from './dto/query-bill-history.dto';
import {
  BillHistoryDto,
  BillHistoryLatestExchangeDto,
  BillHistorySummaryDto,
} from './dto/bill-history.dto';

@Injectable()
export class CashierService {
  constructor(private readonly prisma: PrismaService) {}

  private mapPaymentRecord(p: {
    id: number;
    amount: number;
    remainAmount: number;
    date: bigint | number;
    fileName: string | null;
    type: PaymentMethod;
    saleInvoiceId: string | null;
    userId: number | null;
    customerContact: string | null;
    discountType: PaymentDiscountType;
    discountValue: number;
    cashAmount?: number;
    cardAmount?: number;
  }): PaymentRecordDto {
    const dateNum =
      typeof p.date === 'bigint'
        ? Number(p.date)
        : (p.date as unknown as number);

    const typeStr =
      p.type === 'CASH' ? 'Cash' : p.type === 'CARD' ? 'Card' : 'Split';
    const discountStr =
      p.discountType === 'NO'
        ? 'no'
        : p.discountType === 'PERCENTAGE'
        ? 'percentage'
        : 'amount';

    return {
      id: p.id,
      amount: p.amount,
      remain_amount: p.remainAmount,
      date: dateNum,
      file_name: p.fileName ?? '',
      type: typeStr,
      cash_amount: Number(p.cashAmount ?? 0),
      card_amount: Number(p.cardAmount ?? 0),
      sale_invoice_id: p.saleInvoiceId ?? null,
      user_id: p.userId ?? null,
      customer_contact: p.customerContact ?? null,
      discount_type: discountStr,
      discount_value: p.discountValue,
    };
  }

  private async generateNextSaleInvoiceId(
    prisma: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    const latest = await prisma.payment.findFirst({
      where: { saleInvoiceId: { not: null } },
      select: { saleInvoiceId: true },
      orderBy: { id: 'desc' },
    });

    const last = latest?.saleInvoiceId ?? '';

    const yearMatch = /^INV-(\d{4})-(\d+)$/i.exec(last);
    if (yearMatch) {
      const year = yearMatch[1];
      const seq = parseInt(yearMatch[2], 10) + 1;
      const width = yearMatch[2].length;
      return `INV-${year}-${seq.toString().padStart(width, '0')}`;
    }

    const simpleMatch = /^INV-(\d+)$/i.exec(last);
    if (simpleMatch) {
      const seq = parseInt(simpleMatch[1], 10) + 1;
      const width = Math.max(3, simpleMatch[1].length);
      return `INV-${seq.toString().padStart(width, '0')}`;
    }

    return 'INV-001';
  }

  // Catalog with items/batches
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

    const out: CategoryCatalogDto[] = [];

    for (const c of categories) {
      const items: ItemDto[] = [];

      for (const i of c.items) {
        if (!i.stock || i.stock.length === 0) continue;

        const batches: BatchDto[] = i.stock.map((s) => ({
          batchID: s.batchId,
          pprice: s.unitPrice,
          price: s.sellPrice,
          quantity: s.quantity,
          discountAmount: s.discountAmount,
        }));

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

  async getAllPayments(): Promise<PaymentRecordDto[]> {
    const rows = await this.prisma.payment.findMany({
      orderBy: { date: 'desc' },
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

    return rows.map((p) => this.mapPaymentRecord(p));
  }

  async getAllInvoices(): Promise<PaymentRecordDto[]> {
    const rows = await this.prisma.payment.findMany({
      where: { saleInvoiceId: { not: null } },
      orderBy: { date: 'desc' },
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

    return rows.map((p) => this.mapPaymentRecord(p));
  }

  async insertPayment(dto: CreatePaymentDto): Promise<PaymentRecordDto> {
    const typeEnum: PaymentMethod =
      dto.type === 'Card' ? 'CARD' : dto.type === 'Split' ? 'SPLIT' : 'CASH';
    const discountEnum: PaymentDiscountType =
      dto.discount_type === 'percentage'
        ? 'PERCENTAGE'
        : dto.discount_type === 'amount'
        ? 'AMOUNT'
        : 'NO';

    let saleInvoiceId = (dto.sale_invoice_id ?? '').trim();
    if (!saleInvoiceId) {
      saleInvoiceId = await this.generateNextSaleInvoiceId();
    }

    // Ensure customer exists if a phone is provided (avoids FK errors on payment.customer_contact)
    let customerContact: string | null = dto.customer_contact ?? null;
    if (customerContact) {
      customerContact = customerContact.toString().trim();
      if (customerContact.length > 0) {
        await this.prisma.customer.upsert({
          where: { contact: customerContact },
          update: {},
          create: { contact: customerContact, name: customerContact },
        });
      } else {
        customerContact = null;
      }
    }

    try {
      const cashAmount =
        dto.type === 'Split'
          ? Number(dto.cash_amount ?? 0)
          : dto.type === 'Cash'
          ? dto.amount
          : 0;
      const cardAmount =
        dto.type === 'Split'
          ? Number(dto.card_amount ?? 0)
          : dto.type === 'Card'
          ? dto.amount
          : 0;

      if (dto.type === 'Split') {
        const sum = Number(cashAmount) + Number(cardAmount);
        if (!Number.isFinite(cashAmount) || cashAmount < 0) {
          throw new BadRequestException('cash_amount must be >= 0 for split');
        }
        if (!Number.isFinite(cardAmount) || cardAmount < 0) {
          throw new BadRequestException('card_amount must be >= 0 for split');
        }
        if (Math.abs(sum - dto.amount) > 0.01) {
          throw new BadRequestException(
            'cash_amount + card_amount must equal amount for split',
          );
        }
      }

      const created = await this.prisma.payment.create({
        data: {
          amount: dto.amount,
          remainAmount: dto.remain_amount,
          date: BigInt(dto.date),
          fileName: dto.file_name,
          type: typeEnum,
          cashAmount,
          cardAmount,
          saleInvoiceId,
          userId: dto.user_id ?? null,
          customerContact,
          discountType: discountEnum,
          discountValue: dto.discount_value ?? 0,
        },
      });

      return this.mapPaymentRecord(created);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Duplicate value for unique field');
      }
      if (err?.code === 'P2003') {
        throw new BadRequestException('Invalid relation provided.');
      }
      throw new InternalServerErrorException('Failed to insert payment');
    }
  }

  async insertInvoices(
    dto: CreateInvoicesDto,
    applyStock = true,
    allOrNothing = false,
  ): Promise<{ count: number; stock?: StockApplyResultDto }> {
    const saleId = dto.sale_invoice_id;

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
      return { count: 0 };
    }

    for (const inv of dto.invoices) {
      if (typeof inv.item_id !== 'number' || Number.isNaN(inv.item_id)) {
        throw new BadRequestException(
          'item_id is required and must be a number',
        );
      }
    }

    try {
      let createdCount = 0;

      const result = await this.prisma.$transaction(async (tx) => {
        const data: Array<{
          batchId: string;
          itemId: number;
          quantity: number;
          unitSaledPrice: number;
          saleInvoiceId: string;
        }> = [];

        for (const inv of dto.invoices) {
          const qty = Number(inv.quantity ?? 0);
          const batchId = String(inv.batch_id ?? '').trim();
          const itemId = Number(inv.item_id);

          if (!batchId) {
            throw new BadRequestException(
              'batch_id is required and must be non-empty',
            );
          }
          if (!Number.isFinite(qty) || qty < 1) {
            throw new BadRequestException('quantity must be >= 1');
          }

          let unitPrice = inv.unit_saled_price;
          if (unitPrice == null || Number.isNaN(unitPrice)) {
            const stock = await tx.stock.findFirst({
              where: { batchId, itemId },
              select: { sellPrice: true, discountAmount: true },
            });
            if (!stock) {
              throw new BadRequestException(
                `unit_saled_price missing and stock not found for batch_id=${batchId}, item_id=${itemId}`,
              );
            }
            const discounted =
              Number(stock.sellPrice ?? 0) -
              Number(stock.discountAmount ?? 0);
            unitPrice = discounted >= 0 ? discounted : 0;
          }

          const priceNum = Number(unitPrice);
          if (!Number.isFinite(priceNum) || priceNum < 0) {
            throw new BadRequestException(
              `unit_saled_price invalid for batch_id=${batchId}, item_id=${itemId}`,
            );
          }

          data.push({
            batchId,
            itemId,
            quantity: Math.trunc(qty),
            unitSaledPrice: priceNum,
            saleInvoiceId: saleId,
          });
        }

        const r = await tx.invoice.createMany({
          data,
        });

        // Recalculate payment.amount from all invoices for this sale (fresh sum for accuracy)
        const sumRows = await tx.$queryRaw<
          Array<{ total: number | null }>
        >(Prisma.sql`
          SELECT COALESCE(SUM(unit_saled_price * quantity), 0) AS total
          FROM "invoice"
          WHERE sale_invoice_id = ${saleId}
        `);

        const totalAmount = Number(sumRows?.[0]?.total ?? 0);

        await tx.payment.update({
          where: { saleInvoiceId: saleId },
          data: { amount: totalAmount },
        });

        createdCount = r.count;
        return r;
      });

      let stock: StockApplyResultDto | undefined;
      if (applyStock) {
        stock = await this.updateStockFromInvoicesPayload(
          { invoices: dto.invoices as any[] },
          allOrNothing,
        );
      }

      return { count: result.count, stock };
    } catch (err: any) {
      if (err?.code === 'P2003') {
        throw new BadRequestException(
          'Invalid relation (FK) while inserting invoices',
        );
      }
      throw new InternalServerErrorException('Failed to insert invoices');
    }
  }

  async createSale(
    dto: CreateSaleDto,
    applyStock = true,
    allOrNothing = false,
  ): Promise<{
    sale_invoice_id: string;
    payment: PaymentRecordDto;
    invoices: { count: number };
    stock?: StockApplyResultDto;
  }> {
    const invoices = Array.isArray(dto.invoices) ? dto.invoices : [];
    if (!invoices.length) {
      throw new BadRequestException('At least one invoice line is required');
    }

    const discountEnum: PaymentDiscountType =
      dto.discount_type === 'percentage'
        ? 'PERCENTAGE'
        : dto.discount_type === 'amount'
        ? 'AMOUNT'
        : 'NO';
    const paymentType: PaymentMethod =
      dto.type === 'Card' ? 'CARD' : 'CASH';

    let whenMs = Number(dto.date ?? Date.now());
    if (!Number.isFinite(whenMs)) {
      whenMs = Date.now();
    }

    const txResult = await this.prisma.$transaction(async (tx) => {
      let saleInvoiceId = String(dto.sale_invoice_id ?? '').trim();
      if (!saleInvoiceId) {
        saleInvoiceId = await this.generateNextSaleInvoiceId(tx);
      }

      // Ensure customer exists if provided
      let customerContact: string | null = dto.customer_contact ?? null;
      if (customerContact) {
        customerContact = customerContact.toString().trim();
        if (customerContact.length > 0) {
          await tx.customer.upsert({
            where: { contact: customerContact },
            update: {},
            create: { contact: customerContact, name: customerContact },
          });
        } else {
          customerContact = null;
        }
      }

      const data: Array<{
        batchId: string;
        itemId: number;
        quantity: number;
        unitSaledPrice: number;
        saleInvoiceId: string;
      }> = [];
      let totalAmount = 0;

      for (const inv of invoices) {
        const qty = Number(inv.quantity ?? 0);
        const batchId = String(inv.batch_id ?? '').trim();
        const itemId = Number(inv.item_id);

        if (!batchId) {
          throw new BadRequestException(
            'batch_id is required and must be non-empty',
          );
        }
        if (!Number.isFinite(qty) || qty < 1) {
          throw new BadRequestException('quantity must be >= 1');
        }
        if (!Number.isFinite(itemId) || itemId <= 0) {
          throw new BadRequestException('item_id must be > 0');
        }

        let unitPrice = inv.unit_saled_price;
        if (unitPrice == null || Number.isNaN(unitPrice)) {
          const stock = await tx.stock.findFirst({
            where: { batchId, itemId },
            select: { sellPrice: true, discountAmount: true },
          });
          if (!stock) {
            throw new BadRequestException(
              `unit_saled_price missing and stock not found for batch_id=${batchId}, item_id=${itemId}`,
            );
          }
          const discounted =
            Number(stock.sellPrice ?? 0) - Number(stock.discountAmount ?? 0);
          unitPrice = discounted >= 0 ? discounted : 0;
        }

        const priceNum = Number(unitPrice);
        if (!Number.isFinite(priceNum) || priceNum < 0) {
          throw new BadRequestException(
            `unit_saled_price invalid for batch_id=${batchId}, item_id=${itemId}`,
          );
        }

        data.push({
          batchId,
          itemId,
          quantity: Math.trunc(qty),
          unitSaledPrice: priceNum,
          saleInvoiceId: saleInvoiceId,
        });
        totalAmount += priceNum * Math.trunc(qty);
      }

      let remainAmount = Number(dto.remain_amount ?? 0);
      if (!Number.isFinite(remainAmount) || remainAmount < 0) {
        remainAmount = 0;
      }
      if (remainAmount > totalAmount) {
        remainAmount = totalAmount;
      }

      const cashAmount =
        dto.type === 'Split'
          ? Number(dto.cash_amount ?? 0)
          : dto.type === 'Cash'
          ? totalAmount
          : 0;
      const cardAmount =
        dto.type === 'Split'
          ? Number(dto.card_amount ?? 0)
          : dto.type === 'Card'
          ? totalAmount
          : 0;

      if (dto.type === 'Split') {
        const sum = Number(cashAmount) + Number(cardAmount);
        if (!Number.isFinite(cashAmount) || cashAmount < 0) {
          throw new BadRequestException('cash_amount must be >= 0 for split');
        }
        if (!Number.isFinite(cardAmount) || cardAmount < 0) {
          throw new BadRequestException('card_amount must be >= 0 for split');
        }
        if (Math.abs(sum - totalAmount) > 0.01) {
          throw new BadRequestException(
            'cash_amount + card_amount must equal total amount for split',
          );
        }
      }

      const payment = await tx.payment.create({
        data: {
          amount: totalAmount,
          remainAmount,
          date: BigInt(whenMs),
          fileName:
            dto.file_name?.toString().trim() ||
            `sale-${saleInvoiceId}`.slice(0, 200),
          type: paymentType,
          cashAmount,
          cardAmount,
          saleInvoiceId,
          userId: dto.user_id ?? null,
          customerContact,
          discountType: discountEnum,
          discountValue: dto.discount_value ?? 0,
        },
      });

      const invResult = await tx.invoice.createMany({ data });

      return {
        saleInvoiceId,
        payment: this.mapPaymentRecord(payment),
        invoices: { count: invResult.count },
      };
    });

    let stock: StockApplyResultDto | undefined;
    if (applyStock) {
      stock = await this.updateStockFromInvoicesPayload(
        { invoices: dto.invoices as any[] },
        allOrNothing,
      );
    }

    return {
      sale_invoice_id: txResult.saleInvoiceId,
      payment: txResult.payment,
      invoices: txResult.invoices,
      stock,
    };
  }

  async createQuickSale(
    dto: CreateQuickSaleDto,
  ): Promise<{
    sale_invoice_id: string;
    total: number;
    payment: PaymentRecordDto;
    quick_sales: QuickSaleRecordDto[];
  }> {
    const items = Array.isArray(dto?.items) ? dto.items : [];
    if (items.length === 0) {
      throw new BadRequestException('At least one quick sale item is required');
    }

    const normalized = items.map((raw, idx) => {
      const name = String(raw?.name ?? '').trim();
      const qty =
        typeof raw?.quantity === 'number'
          ? Math.trunc(raw.quantity)
          : Number.parseInt(String(raw?.quantity ?? '0'), 10) || 0;
      const unitCost = Number(
        (raw as any)?.unit_cost ?? (raw as any)?.unitCost ?? 0,
      );
      const unitPrice = Number(
        (raw as any)?.unit_price ??
          (raw as any)?.unitPrice ??
          (raw as any)?.price ??
          0,
      );

      if (!name) {
        throw new BadRequestException(
          `items[${idx}].name is required and must be non-empty`,
        );
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new BadRequestException(
          `items[${idx}].quantity must be an integer >= 1`,
        );
      }
      if (!Number.isFinite(unitCost) || unitCost < 0) {
        throw new BadRequestException(
          `items[${idx}].unit_cost must be >= 0`,
        );
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new BadRequestException(
          `items[${idx}].unit_price must be >= 0`,
        );
      }

      return {
        name,
        quantity: qty,
        unitCost,
        unitPrice,
      };
    });

    const subtotal = normalized.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    );

    const discountType: PaymentDiscountType =
      dto.discount_type === 'percentage'
        ? 'PERCENTAGE'
        : dto.discount_type === 'amount'
        ? 'AMOUNT'
        : 'NO';
    const discountValueNum = Number(dto.discount_value ?? 0);

    let total = subtotal;
    if (discountType === 'PERCENTAGE') {
      total = subtotal - subtotal * (discountValueNum / 100);
    } else if (discountType === 'AMOUNT') {
      total = subtotal - discountValueNum;
    }
    if (!Number.isFinite(total) || total < 0) {
      total = 0;
    }

    let remainAmount = Number(dto.remain_amount ?? 0);
    if (!Number.isFinite(remainAmount) || remainAmount < 0) {
      remainAmount = 0;
    }
    if (remainAmount > total) {
      remainAmount = total;
    }

    const paymentType: PaymentMethod =
      dto.payment_type === 'Card' ? 'CARD' : 'CASH';

    let whenMs = Number(dto.date ?? Date.now());
    if (!Number.isFinite(whenMs)) {
      whenMs = Date.now();
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let saleInvoiceId = String(dto.sale_invoice_id ?? '').trim();
      if (!saleInvoiceId) {
        saleInvoiceId = await this.generateNextSaleInvoiceId(tx);
      }

      // Ensure customer row exists if contact provided
      let customerContact: string | null = dto.customer_contact ?? null;
      if (customerContact) {
        customerContact = customerContact.toString().trim();
        if (customerContact.length > 0) {
          await tx.customer.upsert({
            where: { contact: customerContact },
            update: {},
            create: { contact: customerContact, name: customerContact },
          });
        } else {
          customerContact = null;
        }
      }

      const payment = await tx.payment.create({
        data: {
          amount: total,
          remainAmount,
          date: BigInt(whenMs),
          fileName:
            dto.file_name?.toString().trim() ||
            `quick-sale-${saleInvoiceId}`.slice(0, 200),
          type: paymentType,
          saleInvoiceId,
          userId: dto.user_id ?? null,
          customerContact,
          discountType,
          discountValue: discountValueNum,
        },
      });

      const quickSales: QuickSaleRecordDto[] = [];
      for (const item of normalized) {
        const created = await tx.quickSale.create({
          data: {
            saleInvoiceId,
            userId: dto.user_id ?? null,
            name: item.name,
            quantity: item.quantity,
            unitCost: item.unitCost,
            unitPrice: item.unitPrice,
            createdAt: BigInt(whenMs),
          },
        });

        quickSales.push({
          id: created.id,
          sale_invoice_id: created.saleInvoiceId,
          name: created.name,
          quantity: created.quantity,
          unit_cost: created.unitCost,
          unit_price: created.unitPrice,
          total: created.unitPrice * created.quantity,
          user_id: created.userId ?? null,
          created_at:
            typeof created.createdAt === 'bigint'
              ? Number(created.createdAt)
              : (created.createdAt as unknown as number),
        });
      }

      const paymentDto = this.mapPaymentRecord(payment);
      quickSales.forEach((qs) => {
        qs.payment = paymentDto;
      });

      return {
        sale_invoice_id: saleInvoiceId,
        total,
        payment: paymentDto,
        quick_sales: quickSales,
      };
    });

    return result;
  }

  async getQuickSales(): Promise<QuickSaleRecordDto[]> {
    const rows = await this.prisma.quickSale.findMany({
      include: { payment: true },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => {
      const createdAt =
        typeof r.createdAt === 'bigint'
          ? Number(r.createdAt)
          : Number(r.createdAt ?? 0);
      const paymentDto = r.payment ? this.mapPaymentRecord(r.payment) : null;

      return {
        id: r.id,
        sale_invoice_id: r.saleInvoiceId,
        name: r.name,
        quantity: r.quantity,
        unit_cost: r.unitCost,
        unit_price: r.unitPrice,
        total: r.unitPrice * r.quantity,
        user_id: r.userId ?? null,
        created_at: createdAt,
        payment: paymentDto,
      };
    });
  }

  async getBillHistory(
    userId: number
  ): Promise<BillHistoryDto> {
    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) {
      throw new BadRequestException('userId must be a positive integer');
    }

    

    const where: Prisma.PaymentWhereInput = {
      userId: uid,
      saleInvoiceId: { not: null },
    };

   

    const payments = await this.prisma.payment.findMany({
      
    });

    const bills = payments.map((p) => this.mapPaymentRecord(p));

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMs = start.getTime();
    const endMs = startMs + 24 * 60 * 60 * 1000;

    const salesRows = await this.prisma.$queryRaw<
      Array<{ total: number | null }>
    >(Prisma.sql`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM "payment"
      WHERE user_id = ${uid}
        AND sale_invoice_id IS NOT NULL
        AND date >= ${Prisma.sql`${startMs}::bigint`}
        AND date <  ${Prisma.sql`${endMs}::bigint`}
    `);
    const todaySales = Number(salesRows?.[0]?.total ?? 0);

    const tableExistsRows = await this.prisma.$queryRaw<
      Array<{ exists: boolean | null }>
    >(Prisma.sql`SELECT to_regclass('public.drawer') IS NOT NULL AS exists`);
    const drawerTableExists = !!tableExistsRows?.[0]?.exists;

    let todayIn = 0;
    let todayOut = 0;
    let latestExchange: BillHistoryLatestExchangeDto | null = null;

    if (drawerTableExists) {
      const drawerSums = await this.prisma.$queryRaw<
        Array<{ in_total: number | null; out_total: number | null }>
      >(Prisma.sql`
        SELECT
          COALESCE(SUM(CASE WHEN upper(type) = 'IN' THEN amount ELSE 0 END), 0) AS in_total,
          COALESCE(SUM(CASE WHEN upper(type) = 'OUT' THEN amount ELSE 0 END), 0) AS out_total
        FROM "drawer"
        WHERE user_id = ${uid}
          AND date >= ${Prisma.sql`${startMs}::bigint`}
          AND date <  ${Prisma.sql`${endMs}::bigint`}
      `);

      todayIn = Number(drawerSums?.[0]?.in_total ?? 0);
      todayOut = Number(drawerSums?.[0]?.out_total ?? 0);

      const latestDrawerRows = await this.prisma.$queryRaw<
        Array<{ id: number; amount: number; type: string; reason: string; date: bigint | number }>
      >(Prisma.sql`
        SELECT id, amount, type, reason, date
        FROM "drawer"
        WHERE user_id = ${uid}
        ORDER BY date DESC
        LIMIT 1
      `);

      if (latestDrawerRows?.length) {
        const row = latestDrawerRows[0];
        const dt =
          typeof row.date === 'bigint'
            ? Number(row.date)
            : (row.date as unknown as number);
        latestExchange = {
          id: Number(row.id),
          amount: Number(row.amount ?? 0),
          type: String(row.type ?? ''),
          reason: String(row.reason ?? ''),
          date: dt,
        };
      }
    }

    const summary: BillHistorySummaryDto = {
      today_sales: todaySales,
      today_in: todayIn,
      today_out: todayOut,
      today_net: todaySales + todayIn - todayOut,
    };

    return {
      summary,
      latest_exchange: latestExchange,
      bills,
    };
  }

  async getAllReturns(): Promise<Record<string, any>[]> {
    try {
      const rows =
        await this.prisma.$queryRaw<Array<Record<string, any>>>`
          SELECT * FROM "return" ORDER BY created_at DESC
        `;
      return rows;
    } catch {
      throw new InternalServerErrorException('Failed to fetch returns');
    }
  }

  async getSaleBundleList(
    saleInvoiceId: string,
  ): Promise<Array<Record<string, any>>> {
    const p = await this.prisma.payment.findUnique({
      where: { saleInvoiceId },
      select: {
        saleInvoiceId: true,
        amount: true,
        remainAmount: true,
        type: true,
        fileName: true,
        date: true,
        userId: true,
        customerContact: true,
        discountType: true,
        discountValue: true,
      },
    });

    if (!p) return [];

    const header: Record<string, any> = {
      sale_invoice_id: p.saleInvoiceId?.toString(),
      payment_amount: Number(p.amount ?? 0),
      payment_remain_amount: Number(p.remainAmount ?? 0),
      payment_type: p.type === 'CARD' ? 'Card' : 'Cash',
      payment_file_name: p.fileName ?? null,
      payment_date:
        typeof p.date === 'bigint' ? Number(p.date) : Number(p.date ?? 0),
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

    const quickRows = await this.prisma.quickSale.findMany({
      where: { saleInvoiceId },
      orderBy: { id: 'asc' },
    });

    const quickMaps = quickRows.map((r) => {
      const qtyNum = Number(r.quantity ?? 0);
      const qty = Number.isFinite(qtyNum) ? Math.trunc(qtyNum) : 0;
      const unitPrice = Number(r.unitPrice ?? 0);
      const unitCost = Number(r.unitCost ?? 0);

      return {
        invoice_id: -r.id,
        batch_id: `QUICK-${r.id}`,
        item_id: 0,
        quantity: qty,
        saled_unit_price: unitPrice,
        item_name: r.name,
        item_barcode: null,
        unit_price: unitCost,
        sell_price: unitPrice,
        discount_amount: 0,
        final_unit_price: unitPrice,
        line_total: unitPrice * qty,
        quick_sale: true,
      };
    });

    return [header, ...lineMaps, ...quickMaps];
  }

  async getReturnsRich(): Promise<ReturnRichDto[]> {
    try {
      const rows =
        await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
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
            barcode:
              row.item_barcode == null ? null : String(row.item_barcode),
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
    } catch {
      throw new InternalServerErrorException('Failed to fetch returns (rich).');
    }
  }

  async insertReturn(dto: CreateReturnDto): Promise<{ id: number }> {
    const userId = Number(dto.user_id);
    const batchId = String(dto.batch_id ?? '').trim();
    const itemId = Number(dto.item_id);
    const quantity = Number(dto.quantity);
    const unitSaledPrice = Number(dto.unit_saled_price);
    const saleInvoiceId = String(dto.sale_invoice_id ?? '').trim();

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
    if (!batchId) {
      throw new BadRequestException(
        'batch_id is required and must be non-empty',
      );
    }
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
      throw new BadRequestException(
        'sale_invoice_id is required and must be non-empty',
      );
    }

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
      const code = (err as PrismaClientKnownRequestError)?.code;
      if (code === 'P2003') {
        throw new BadRequestException(
          'Invalid relation (FK) while inserting return',
        );
      }
      if (code === 'P2002') {
        throw new ConflictException(
          'Duplicate value for unique field on return',
        );
      }
      throw new InternalServerErrorException('Failed to insert return');
    }
  }

  async deleteReturn(id: number): Promise<{ deleted: number }> {
    const rid = Number(id);
    if (!Number.isInteger(rid) || rid <= 0) {
      throw new BadRequestException('id must be a positive integer');
    }

    try {
      const affected = await this.prisma.$executeRaw(
        Prisma.sql`DELETE FROM "return" WHERE id = ${rid}`,
      );

      if (!affected) {
        throw new NotFoundException(`Return id=${rid} not found`);
      }
      return { deleted: affected };
    } catch {
      throw new InternalServerErrorException('Failed to delete return');
    }
  }

  async toggleReturnDone(
    id: number,
    dto: UpdateReturnDoneDto,
  ): Promise<{ updated: number }> {
    const rid = Number(id);
    if (!Number.isInteger(rid) || rid <= 0) {
      throw new BadRequestException('id must be a positive integer');
    }

    const flag = dto.is_done ? 1 : 0;

    try {
      const affected = await this.prisma.$executeRaw(
        Prisma.sql`UPDATE "return" SET is_done = ${flag} WHERE id = ${rid}`,
      );

      if (!affected) {
        throw new NotFoundException(`Return id=${rid} not found`);
      }
      return { updated: affected };
    } catch {
      throw new InternalServerErrorException('Failed to update is_done');
    }
  }

  async clearAllReturns(): Promise<{ deleted: number }> {
    try {
      const affected = await this.prisma.$executeRaw(
        Prisma.sql`DELETE FROM "return"`,
      );
      return { deleted: affected };
    } catch {
      throw new InternalServerErrorException('Failed to clear returns');
    }
  }

  private buildDrawerWhereClause(filters: {
    userId?: number;
    type?: string;
    dateFromMillis?: number;
    dateToMillis?: number;
    search?: string;
  }): Prisma.Sql {
    const whereClauses: Prisma.Sql[] = [];

    const uid =
      filters.userId != null && Number.isFinite(Number(filters.userId))
        ? Number(filters.userId)
        : undefined;
    if (uid) whereClauses.push(Prisma.sql`user_id = ${uid}`);

    if (filters.type) {
      const t = String(filters.type).toUpperCase();
      if (t === 'IN' || t === 'OUT') {
        whereClauses.push(Prisma.sql`upper(type) = ${t}`);
      }
    }

    if (filters.dateFromMillis != null) {
      const fromMs = Number(filters.dateFromMillis);
      if (Number.isFinite(fromMs)) {
        whereClauses.push(
          Prisma.sql`date >= ${Prisma.sql`${fromMs}::bigint`}`,
        );
      }
    }

    if (filters.dateToMillis != null) {
      const toMs = Number(filters.dateToMillis);
      if (Number.isFinite(toMs)) {
        whereClauses.push(
          Prisma.sql`date <= ${Prisma.sql`${toMs}::bigint`}`,
        );
      }
    }

    if (filters.search) {
      const term = String(filters.search).trim();
      if (term.length > 0) {
        const like = `%${term}%`;
        whereClauses.push(
          Prisma.sql`
            (
              CAST(id AS TEXT) ILIKE ${like}
              OR CAST(amount AS TEXT) ILIKE ${like}
              OR COALESCE(reason, '') ILIKE ${like}
            )
          `,
        );
      }
    }

    return whereClauses.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(whereClauses, ' AND ')}`
      : Prisma.empty;
  }

  private normalizeDrawerRows(
    rows: Array<Record<string, any>>,
  ): Array<Record<string, any>> {
    return rows.map((r) => {
      const o: Record<string, any> = {};
      for (const k of Object.keys(r)) {
        const v = (r as any)[k];
        o[k] = typeof v === 'bigint' ? Number(v) : v;
      }
      return o;
    });
  }

  private async ensureDrawerTable(): Promise<boolean> {
    const existsRows = await this.prisma.$queryRaw<
      Array<{ exists: boolean | null }>
    >(Prisma.sql`SELECT to_regclass('public.drawer') IS NOT NULL AS exists`);
    const exists = !!existsRows?.[0]?.exists;
    if (exists) return true;

    await this.prisma.$executeRaw(Prisma.sql`
      CREATE TABLE IF NOT EXISTS "drawer" (
        id SERIAL PRIMARY KEY,
        amount DOUBLE PRECISION NOT NULL,
        date BIGINT NOT NULL,
        reason TEXT NOT NULL,
        type TEXT NOT NULL,
        user_id INTEGER NOT NULL
      )
    `);
    return true;
  }

  async getDrawersByUserId(
    userId: number,
    todayOnly = false,
  ): Promise<Record<string, any>[]> {
    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) {
      throw new BadRequestException('userId must be a positive integer');
    }

    let startMs: number | null = null;
    let endMs: number | null = null;
    if (todayOnly) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      startMs = start.getTime();
      endMs = end.getTime();
    }

    await this.ensureDrawerTable();

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

    return rows.map((r) => {
      const o: Record<string, any> = {};
      for (const k of Object.keys(r)) {
        const v = (r as any)[k];
        o[k] = typeof v === 'bigint' ? Number(v) : v;
      }
      return o;
    });
  }

  async hasDrawersByUserId(
    userId: number,
    todayOnly = false,
  ): Promise<{ has: boolean }> {
    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) {
      throw new BadRequestException('userId must be a positive integer');
    }

    let startMs: number | null = null;
    let endMs: number | null = null;
    if (todayOnly) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      startMs = start.getTime();
      endMs = end.getTime();
    }

    await this.ensureDrawerTable();

    const row = await this.prisma.$queryRaw<Array<{ cnt: bigint }>>(
      todayOnly
        ? Prisma.sql`
            SELECT COUNT(*)::bigint AS cnt
            FROM "drawer"
            WHERE user_id = ${uid}
              AND date >= ${Prisma.sql`${startMs}::bigint`}
              AND date <  ${Prisma.sql`${endMs}::bigint`}
          `
        : Prisma.sql`
            SELECT COUNT(*)::bigint AS cnt
            FROM "drawer"
            WHERE user_id = ${uid}
          `,
    );

    const cnt = row?.[0]?.cnt ?? BigInt(0);
    return { has: Number(cnt) > 0 };
  }

  async getLatestShopById(): Promise<Record<string, any> | null> {
    const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT * FROM "shop"
      ORDER BY id DESC
      LIMIT 1
    `);
    if (!rows?.length) return null;

    const r = rows[0];
    const out: Record<string, any> = {};
    for (const k of Object.keys(r)) {
      const v = (r as any)[k];
      out[k] = typeof v === 'bigint' ? Number(v) : v;
    }
    return out;
  }

  async getDrawerHistory(
    userId: number,
    q: QueryDrawersDto,
  ): Promise<{
    summary: {
      total_in: number;
      total_out: number;
      net: number;
      count: number;
    };
    rows: Array<Record<string, any>>;
  }> {
    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) {
      throw new BadRequestException('userId must be a positive integer');
    }

    await this.ensureDrawerTable();

    const whereSql = this.buildDrawerWhereClause({
      userId: uid,
      type: q.type,
      dateFromMillis: q.dateFromMillis,
      dateToMillis: q.dateToMillis,
      search: q.search,
    });

    const orderSql =
      (q.orderBy ?? 'date_desc_id_desc') === 'date_asc_id_asc'
        ? Prisma.sql`ORDER BY date ASC, id ASC`
        : Prisma.sql`ORDER BY date DESC, id DESC`;

    const base = Prisma.sql`
      SELECT * FROM "drawer"
      ${whereSql}
      ${orderSql}
    `;

    let rows: Array<Record<string, any>>;
    if (q.limit != null && q.offset != null) {
      rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(
        Prisma.sql`${base} LIMIT ${q.limit} OFFSET ${q.offset}`,
      );
    } else if (q.limit != null) {
      rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(
        Prisma.sql`${base} LIMIT ${q.limit}`,
      );
    } else {
      rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(base);
    }

    const totals =
      await this.prisma.$queryRaw<
        Array<{ total_in: number | null; total_out: number | null; count: bigint | number | null }>
      >(Prisma.sql`
        SELECT
          COALESCE(SUM(CASE WHEN upper(type) = 'IN' THEN amount ELSE 0 END), 0) AS total_in,
          COALESCE(SUM(CASE WHEN upper(type) = 'OUT' THEN amount ELSE 0 END), 0) AS total_out,
          COUNT(*)::bigint AS count
        FROM "drawer"
        ${whereSql}
      `);

    const totalsRow = totals?.[0];
    const totalIn = Number(totalsRow?.total_in ?? 0);
    const totalOut = Number(totalsRow?.total_out ?? 0);
    const count =
      typeof totalsRow?.count === 'bigint'
        ? Number(totalsRow.count)
        : Number(totalsRow?.count ?? 0);

    return {
      summary: {
        total_in: totalIn,
        total_out: totalOut,
        net: totalIn - totalOut,
        count,
      },
      rows: this.normalizeDrawerRows(rows),
    };
  }

  async getDrawersByUserIdPaged(
    userId: number,
    q: DrawersQueryDto,
  ): Promise<Record<string, any>[]> {
    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) {
      throw new BadRequestException('userId must be a positive integer');
    }

    await this.ensureDrawerTable();

    const orderSql =
      (q.orderBy ?? 'date_desc_id_desc') === 'date_asc_id_asc'
        ? Prisma.sql`ORDER BY date ASC, id ASC`
        : Prisma.sql`ORDER BY date DESC, id DESC`;

    const lim = q.limit && q.limit > 0 ? q.limit : undefined;
    const off = q.offset && q.offset >= 0 ? q.offset : undefined;

    const whereSql = this.buildDrawerWhereClause({
      userId: uid,
      type: q.type,
      dateFromMillis: q.dateFromMillis,
      dateToMillis: q.dateToMillis,
      search: q.search,
    });

    const base = Prisma.sql`
      SELECT * FROM "drawer"
      ${whereSql}
      ${orderSql}
    `;

    const rows =
      lim !== undefined && off !== undefined
        ? await this.prisma.$queryRaw<Array<Record<string, any>>>(
            Prisma.sql`${base} LIMIT ${lim} OFFSET ${off}`,
          )
        : lim !== undefined
        ? await this.prisma.$queryRaw<Array<Record<string, any>>>(
            Prisma.sql`${base} LIMIT ${lim}`,
          )
        : await this.prisma.$queryRaw<Array<Record<string, any>>>(base);

    return this.normalizeDrawerRows(rows);
  }

  async updateStockFromInvoicesPayload(
    payload: UpdateStockFromInvoicesPayloadDto,
    allOrNothing = false,
  ): Promise<StockApplyResultDto> {
    const invoices = Array.isArray(payload?.invoices) ? payload.invoices : [];

    const updated: StockApplyUpdatedDto[] = [];
    const warnings: StockApplyWarnDto[] = [];
    const missing: StockApplyMissingDto[] = [];

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const raw of invoices) {
          const inv = raw as Record<string, any>;

          const batchId = String(inv['batch_id'] ?? inv['batchId'] ?? '').trim();
          const itemIdRaw = inv['item_id'] ?? inv['itemId'];
          const itemId =
            typeof itemIdRaw === 'number'
              ? itemIdRaw
              : parseInt(String(itemIdRaw ?? ''), 10) || 0;

          const qtyRaw = inv['quantity'];
          const qtyReq =
            typeof qtyRaw === 'number'
              ? Math.trunc(qtyRaw)
              : parseInt(String(qtyRaw ?? ''), 10) || 0;

          if (!batchId || itemId < 0 || qtyReq <= 0) {
            warnings.push({
              batch_id: batchId,
              item_id: itemId,
              requested: qtyReq,
              available: null,
              reason: 'invalid_input',
            });
            continue;
          }

          if (itemId === 0) {
            updated.push({
              batch_id: batchId,
              item_id: itemId,
              deducted: 0,
              note: 'item_id=0 Quick sale',
            });
            continue;
          }

          const affected = await tx.$executeRaw(
            Prisma.sql`
              UPDATE "stock"
              SET quantity = quantity - ${qtyReq}
              WHERE batch_id = ${batchId}
                AND item_id  = ${itemId}
                AND quantity >= ${qtyReq}
            `,
          );

          if (affected === 1) {
            updated.push({
              batch_id: batchId,
              item_id: itemId,
              deducted: qtyReq,
            });
            continue;
          }

          const rows = await tx.$queryRaw<Array<{ quantity: number }>>(Prisma.sql`
            SELECT quantity FROM "stock"
            WHERE batch_id = ${batchId} AND item_id = ${itemId}
            LIMIT 1
          `);

          if (!rows.length) {
            // Fallback: allow batch-only match in case the frontend sent a wrong item_id
            const fallback = await tx.stock.findFirst({
              where: { batchId },
              select: { id: true, itemId: true, quantity: true },
            });

            if (fallback) {
              const affectedFallback = await tx.$executeRaw(
                Prisma.sql`
                  UPDATE "stock"
                  SET quantity = quantity - ${qtyReq}
                  WHERE id = ${fallback.id} AND quantity >= ${qtyReq}
                `,
              );

              if (affectedFallback === 1) {
                updated.push({
                  batch_id: batchId,
                  item_id: fallback.itemId,
                  deducted: qtyReq,
                  note: 'fallback: batch matched, item_id corrected',
                });
                continue;
              }

              warnings.push({
                batch_id: batchId,
                item_id: fallback.itemId,
                requested: qtyReq,
                available: Number(fallback.quantity ?? 0),
                reason: 'insufficient_stock',
              });
              continue;
            }

            missing.push({
              batch_id: batchId,
              item_id: itemId,
              requested: qtyReq,
              reason: 'not_found',
            });
          } else {
            const avail = Number(rows[0].quantity ?? 0);
            warnings.push({
              batch_id: batchId,
              item_id: itemId,
              requested: qtyReq,
              available: Number.isFinite(avail) ? avail : 0,
              reason: 'insufficient_stock',
            });
          }
        }

        if (allOrNothing && (warnings.length > 0 || missing.length > 0)) {
          throw new Error('ROLLBACK_STOCK_UPDATE');
        }
      });
    } catch {
    }

    return { updated, warnings, missing };
  }

  async insertDrawer(dto: InsertDrawerDto): Promise<{ id: number }> {
    const amount = Number(dto.amount);
    const reason = String(dto.reason ?? '').trim();
    const type = String(dto.type ?? '').trim().toUpperCase();
    const userId = Number(dto.user_id);

    let whenMs: number;
    if (typeof dto.date === 'number') {
      whenMs = dto.date;
    } else if (typeof dto.date === 'string' && dto.date.trim().length > 0) {
      const parsed = Date.parse(dto.date);
      if (Number.isNaN(parsed)) throw new BadRequestException('Invalid date string');
      whenMs = parsed;
    } else {
      whenMs = Date.now();
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a positive number');
    }
    if (!reason) {
      throw new BadRequestException(
        'reason is required and must be non-empty',
      );
    }
    if (type !== 'IN' && type !== 'OUT') {
      throw new BadRequestException('type must be IN or OUT');
    }
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('user_id is required and must be > 0');
    }
    if (!Number.isFinite(whenMs)) {
      throw new BadRequestException('date is invalid');
    }

    try {
      await this.ensureDrawerTable();

      const rows = await this.prisma.$queryRaw<Array<{ id: number }>>(Prisma.sql`
        INSERT INTO "drawer" ("amount","date","reason","type","user_id")
        VALUES (${amount}, ${Prisma.sql`${whenMs}::bigint`}, ${reason}, ${type}, ${userId})
        RETURNING id
      `);
      const created = rows?.[0];
      if (!created) throw new InternalServerErrorException('Insert failed');
      return { id: created.id };
    } catch {
      throw new InternalServerErrorException('Failed to insert drawer row');
    }
  }

  async getAllDrawers(q: QueryDrawersDto = {} as QueryDrawersDto): Promise<Record<string, any>[]> {
    await this.ensureDrawerTable();

    const whereSql = this.buildDrawerWhereClause({
      userId: q?.userId,
      type: q?.type,
      dateFromMillis: q?.dateFromMillis,
      dateToMillis: q?.dateToMillis,
      search: q?.search,
    });

    const orderSql: Prisma.Sql =
      (q?.orderBy ?? 'date_desc_id_desc') === 'date_asc_id_asc'
        ? Prisma.sql`ORDER BY date ASC, id ASC`
        : Prisma.sql`ORDER BY date DESC, id DESC`;

    const base = Prisma.sql`
      SELECT * FROM "drawer"
      ${whereSql}
      ${orderSql}
    `;

    let rows: Array<Record<string, any>>;
    if (q?.limit != null && q?.offset != null) {
      rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(
        Prisma.sql`${base} LIMIT ${q.limit} OFFSET ${q.offset}`,
      );
    } else if (q?.limit != null) {
      rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(
        Prisma.sql`${base} LIMIT ${q.limit}`,
      );
    } else {
      rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(base);
    }

    return this.normalizeDrawerRows(rows);
  }

  async getDrawerById(id: number): Promise<Record<string, any> | null> {
    const rid = Number(id);
    if (!Number.isInteger(rid) || rid <= 0) {
      throw new BadRequestException('id must be > 0');
    }

    await this.ensureDrawerTable();

    const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(
      Prisma.sql`
      SELECT * FROM "drawer" WHERE id = ${rid} LIMIT 1
    `,
    );
    if (!rows?.length) return null;

    const r = rows[0];
    const out: Record<string, any> = {};
    for (const k of Object.keys(r)) {
      const v = (r as any)[k];
      out[k] = typeof v === 'bigint' ? Number(v) : v;
    }
    return out;
  }
}
