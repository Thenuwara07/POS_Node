import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async createItem(dto: CreateItemDto) {
    // Using CHECKED input: relations via nested connect
    return this.prisma.item.create({
      data: {
        name: dto.name,
        barcode: dto.barcode,
        unit: dto.unit,

        // Relations — use nested connects (do NOT send supplierId/categoryId directly)
        category: { connect: { id: dto.categoryId } },
        supplier: { connect: { id: dto.supplierId } },

        // Scalars
        status: dto.status ?? 'Active',
        cost: dto.cost,
        markup: dto.markup,
        salePrice: dto.salePrice,
        reorderLevel: dto.reorderLevel ?? undefined,
        lowStockWarn: dto.lowStockWarn ?? undefined,
        gradient: dto.gradient ?? null,
        remark: dto.remark ?? null,
        colorCode: dto.colorCode ?? '#000000',
      },
      include: { category: true, supplier: true },
    });
  }

  async updateItem(id: number, dto: UpdateItemDto) {
    // Ensure the item exists
    const exists = await this.prisma.item.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Item not found');

    return this.prisma.item.update({
      where: { id },
      data: {
        // Scalars (undefined skips update)
        name: dto.name ?? undefined,
        barcode: dto.barcode ?? undefined,
        unit: dto.unit ?? undefined,
        status: dto.status ?? undefined,
        cost: dto.cost ?? undefined,
        markup: dto.markup ?? undefined,
        salePrice: dto.salePrice ?? undefined,
        reorderLevel: dto.reorderLevel ?? undefined,
        lowStockWarn: dto.lowStockWarn ?? undefined,
        gradient: dto.gradient ?? undefined, // send null explicitly if you want to clear it
        remark: dto.remark ?? undefined,
        colorCode: dto.colorCode ?? undefined,

        // Relations — only connect when provided
        category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
        supplier: dto.supplierId ? { connect: { id: dto.supplierId } } : undefined,
      },
      include: { category: true, supplier: true },
    });
  }

  async getItemById(id: number) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: { category: true, supplier: true },
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async getItems(params?: {
    q?: string;
    categoryId?: number;
    supplierId?: number;
    skip?: number;
    take?: number;
  }) {
    const { q, categoryId, supplierId, skip, take } = params ?? {};

    return this.prisma.item.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { name: { contains: q, mode: 'insensitive' } },
                  { barcode: { contains: q, mode: 'insensitive' } },
                ],
              }
            : {},
          categoryId ? { category: { is: { id: categoryId } } } : {},
          supplierId ? { supplier: { is: { id: supplierId } } } : {},
        ],
      },
      include: { category: true, supplier: true },
      skip,
      take,
      orderBy: { id: 'desc' },
    });
  }

  async deleteItem(id: number) {
    // Optional: verify exists for nicer error
    const exists = await this.prisma.item.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Item not found');

    return this.prisma.item.delete({
      where: { id },
    });
  }
}
