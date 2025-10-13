// import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { ItemDto } from './dto/total-items.dto';
// import { LowStockItemDto } from './dto/low-stock.dto';
// import { CreateRestockDto, LookupItemQueryDto } from './dto/re-stock.dto';

// @Injectable()
// export class InventoryService {
//   constructor(private readonly prisma: PrismaService) {}

//   // ---------------- existing methods ----------------
//   async getAllItems(): Promise<ItemDto[]> {
//     const items = await this.prisma.item.findMany({
//       select: { id: true, name: true },
//       orderBy: { name: 'asc' },
//     });
//     if (items.length === 0) return [];

//     const itemIds = items.map((i) => i.id);

//     const qtyAgg = await this.prisma.stock.groupBy({
//       by: ['itemId'],
//       _sum: { quantity: true },
//       where: { itemId: { in: itemIds } },
//     });

//     const qtyMap = new Map<number, number>(
//       qtyAgg.map((g) => [g.itemId, g._sum.quantity ?? 0]),
//     );

//     const latestIdPerItem = await this.prisma.stock.groupBy({
//       by: ['itemId'],
//       _max: { id: true },
//       where: { itemId: { in: itemIds } },
//     });

//     const latestIds = latestIdPerItem
//       .map((g) => g._max.id)
//       .filter((v): v is number => typeof v === 'number');

//     const latestStocks = latestIds.length
//       ? await this.prisma.stock.findMany({
//           where: { id: { in: latestIds } },
//           select: { itemId: true, unitPrice: true, sellPrice: true },
//         })
//       : [];

//     const priceMap = new Map<number, { unitPrice: number; sellPrice: number }>();
//     for (const s of latestStocks) {
//       priceMap.set(s.itemId, {
//         unitPrice: s.unitPrice ?? 0,
//         sellPrice: s.sellPrice ?? 0,
//       });
//     }

//     const rows: ItemDto[] = items.map((it) => {
//       const quantity = qtyMap.get(it.id) ?? 0;
//       const prices = priceMap.get(it.id) ?? { unitPrice: 0, sellPrice: 0 };
//       return {
//         id: it.id,
//         name: it.name,
//         quantity,
//         unitPrice: prices.unitPrice,
//         sellPrice: prices.sellPrice,
//         totalSales: quantity * prices.sellPrice,
//       };
//     });

//     return rows;
//   }

//   async getLowStockItems(threshold = 3): Promise<LowStockItemDto[]> {
//     const all = await this.getAllItems();
//     return all
//       .filter((i) => i.quantity <= threshold)
//       .map((i) => ({ ...i, isLowStock: true as const, threshold }));
//   }

//   // ---------------- helpers for restock ----------------
//   private genBatchId(itemId: number) {
//     const d = new Date();
//     const pad = (n: number) => n.toString().padStart(2, '0');
//     const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
//     return `RSTK-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${itemId}-${rand}`;
//     // Example: RSTK-20250902-12-A1B2C3
//   }

//   private async resolveItemId(entry: { itemId?: number; barcode?: string }) {
//     if (entry.itemId) return entry.itemId;
//     if (!entry.barcode) {
//       throw new BadRequestException('Provide itemId or barcode');
//     }
//     const item = await this.prisma.item.findUnique({
//       where: { barcode: entry.barcode },
//       select: { id: true },
//     });
//     if (!item) throw new NotFoundException(`Item not found (barcode=${entry.barcode})`);
//     return item.id;
//   }

//   private async computedCurrentStock(itemId: number) {
//     const inbound = await this.prisma.stock.aggregate({
//       where: { itemId },
//       _sum: { quantity: true },
//     });
//     const outbound = await this.prisma.invoice.aggregate({
//       where: { itemId },
//       _sum: { quantity: true },
//     });
//     return (inbound._sum.quantity ?? 0) - (outbound._sum.quantity ?? 0);
//   }

//   // ---------------- new endpoints logic ----------------
//   async lookupItemWithStock(q: LookupItemQueryDto) {
//     if (!q.id && !q.barcode) {
//       throw new BadRequestException('Provide id or barcode');
//     }

//     const item = await this.prisma.item.findFirst({
//       where: {
//         OR: [
//           q.id ? { id: q.id } : undefined,
//           q.barcode ? { barcode: q.barcode } : undefined,
//         ].filter(Boolean) as any,
//       },
//       include: { category: true, supplier: true },
//     });
//     if (!item) throw new NotFoundException('Item not found');

//     // Latest selling price from latest stock batch (if any)
//     const latestStock = await this.prisma.stock.findFirst({
//       where: { itemId: item.id },
//       orderBy: { id: 'desc' },
//       select: { sellPrice: true },
//     });

//     const currentStock = await this.computedCurrentStock(item.id);

//     return {
//       id: item.id,
//       name: item.name,
//       category: item.category?.category ?? '',
//       barcode: item.barcode,
//       supplier: item.supplier?.name ?? '',
//       minStock: item.reorderLevel ?? 0,
//       maxStock: 0, // not in schema; return 0 or derive from policy
//       price: latestStock?.sellPrice ?? 0,
//       currentStock,
//     };
//   }

//   async restock(dto: CreateRestockDto) {
//     if (!dto.entries?.length) {
//       throw new BadRequestException('No restock entries provided');
//     }

//     // Basic validation
//     for (const e of dto.entries) {
//       if (e.quantity <= 0) throw new BadRequestException('Quantity must be positive');
//       if (e.unitPrice < 0 || e.sellPrice < 0) {
//         throw new BadRequestException('Prices must be >= 0');
//       }
//     }

//     return this.prisma.$transaction(async (tx) => {
//       let totalCost = 0;
//       const createdStocks: Array<{
//         id: number;
//         batchId: string;
//         itemId: number;
//         quantity: number;
//         unitPrice: number;
//         sellPrice: number;
//         supplierId: number;
//       }> = [];

//       for (const entry of dto.entries) {
//         const itemId = await this.resolveItemId(entry);

//         const supplier = await tx.supplier.findUnique({
//           where: { id: entry.supplierId },
//           select: { id: true },
//         });
//         if (!supplier) throw new NotFoundException(`Supplier not found (id=${entry.supplierId})`);

//         const batchId = entry.batchId ?? this.genBatchId(itemId);
//         const discount = entry.discountAmount ?? 0;

//         totalCost += entry.unitPrice * entry.quantity;

//         const stock = await tx.stock.create({
//           data: {
//             batchId,
//             itemId,
//             quantity: entry.quantity,
//             unitPrice: entry.unitPrice,
//             sellPrice: entry.sellPrice,
//             discountAmount: discount,
//             supplierId: entry.supplierId,
//           },
//           select: {
//             id: true, batchId: true, itemId: true, quantity: true,
//             unitPrice: true, sellPrice: true, supplierId: true,
//           },
//         });

//         createdStocks.push(stock);
//       }

//       // Optionally create SupplierTransaction(s), grouped by supplier
//       if (dto.recordSupplierTransaction) {
//         const bySupplier = new Map<number, number>();
//         for (const e of dto.entries) {
//           bySupplier.set(
//             e.supplierId,
//             (bySupplier.get(e.supplierId) ?? 0) + e.unitPrice * e.quantity,
//           );
//         }
//         for (const [supplierId, amount] of bySupplier.entries()) {
//           await tx.supplierTransaction.create({
//             data: { supplierId, amount, date: dto.date ?? new Date() },
//           });
//         }
//       }

//       // Build response with fresh currentStock values
//       const batches = await Promise.all(
//         createdStocks.map(async (s) => {
//           const item = await tx.item.findUnique({ where: { id: s.itemId }, select: { name: true } });
//           const currentStock = await this.computedCurrentStock(s.itemId);
//           return {
//             stockId: s.id,
//             batchId: s.batchId,
//             itemId: s.itemId,
//             itemName: item?.name ?? '',
//             quantityAdded: s.quantity,
//             unitPrice: s.unitPrice,
//             sellPrice: s.sellPrice,
//             supplierId: s.supplierId,
//             currentStock,
//           };
//         }),
//       );

//       return {
//         message: `Restocked ${batches.length} batch(es)`,
//         totalCost,
//         batches,
//       };
//     });
//   }
// }
