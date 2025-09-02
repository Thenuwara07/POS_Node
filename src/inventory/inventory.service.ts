import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ItemDto } from './dto/total-items.dto';
import { LowStockItemDto } from '../inventory/dto/low-stock.dto'

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns: id, name, quantity (sum of stock), unitPrice/sellPrice (from latest stock),
   * totalSales = quantity * sellPrice
   */
  async getAllItems(): Promise<ItemDto[]> {
    // 0) Fetch all items (id + name) to ensure items with zero stock still appear.
    const items = await this.prisma.item.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    if (items.length === 0) return [];

    const itemIds = items.map((i) => i.id);

    // 1) Sum quantity per item
    const qtyAgg = await this.prisma.stock.groupBy({
      by: ['itemId'],
      _sum: { quantity: true },
      where: { itemId: { in: itemIds } },
    });

    const qtyMap = new Map<number, number>(
      qtyAgg.map((g) => [g.itemId, g._sum.quantity ?? 0]),
    );

    // 2) Latest stock row per item (by max id) to pick current prices
    const latestIdPerItem = await this.prisma.stock.groupBy({
      by: ['itemId'],
      _max: { id: true },
      where: { itemId: { in: itemIds } },
    });

    const latestIds = latestIdPerItem
      .map((g) => g._max.id)
      .filter((v): v is number => typeof v === 'number');

    const latestStocks = latestIds.length
      ? await this.prisma.stock.findMany({
          where: { id: { in: latestIds } },
          select: { itemId: true, unitPrice: true, sellPrice: true },
        })
      : [];

    const priceMap = new Map<number, { unitPrice: number; sellPrice: number }>();
    for (const s of latestStocks) {
      priceMap.set(s.itemId, {
        unitPrice: s.unitPrice ?? 0,
        sellPrice: s.sellPrice ?? 0,
      });
    }

    // 3) Build response rows
    const rows: ItemDto[] = items.map((it) => {
      const quantity = qtyMap.get(it.id) ?? 0;
      const prices = priceMap.get(it.id) ?? { unitPrice: 0, sellPrice: 0 };
      return {
        id: it.id,
        name: it.name,
        quantity,
        unitPrice: prices.unitPrice,
        sellPrice: prices.sellPrice,
        totalSales: quantity * prices.sellPrice,
      };
    });

    return rows;
  }

  /**
   * Low stock = quantity <= threshold (default 3).
   * Builds on getAllItems() so items with zero stock are included.
   */
  async getLowStockItems(threshold = 3): Promise<LowStockItemDto[]> {
    const all = await this.getAllItems();
    return all
      .filter((i) => i.quantity <= threshold)
      .map((i) => ({ ...i, isLowStock: true as const, threshold }));
  }
}
