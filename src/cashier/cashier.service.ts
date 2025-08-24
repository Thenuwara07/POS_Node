import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CashierService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategoriesWithItems() {
    const categories = await this.prisma.category.findMany({
      include: {
        items: {
          // only items that have at least one batch with quantity > 0
          where: {
            stock: {
              some: { quantity: { gt: 0 } },
            },
          },
          include: {
            stock: {
              where: { quantity: { gt: 0 } }, // only in-stock batches
              select: {
                batchId: true,
                unitPrice: true,
                sellPrice: true,
                quantity: true,
                discountAmount: true,
              },
              orderBy: { sellPrice: 'asc' }, // optional
            },
          },
          orderBy: { name: 'asc' }, // optional
        },
      },
      orderBy: { id: 'asc' }, // optional
    });

    // If you also want to drop categories that end up with zero items, filter here:
    const nonEmptyCategories = categories.filter((c) => c.items.length > 0);

    return nonEmptyCategories.map((category) => ({
      id: category.id,
      category: category.category,
      colorCode: category.colorCode,
      items: category.items.map((item) => ({
        id: item.id,
        itemcode: item.barcode,
        name: item.name,
        colorCode: item.colorCode,
        batches: item.stock.map((s) => ({
          batchID: s.batchId,
          pprice: s.unitPrice,
          price: s.sellPrice,
          quantity: s.quantity,
          discountAmount: s.discountAmount,
          // Optional: derived net price if discountAmount is per-unit amount
          // netPrice: Math.max(s.sellPrice - (s.discountAmount ?? 0), 0),
        })),
      })),
    }));
  }
}
