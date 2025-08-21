// src/stock/stock.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  // ADD ITEM
  async createItem(_user: any, dto: CreateItemDto) {
    // ensure supplier exists
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
      select: { id: true },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    return this.prisma.item.create({
      data: {
        name: dto.name,
        barcode: dto.barcode,
        unit: dto.unit,
        category: dto.category,
        status: dto.status ?? undefined, // let DB default if not provided
        cost: dto.cost,
        markup: dto.markup,
        salePrice: dto.salePrice,
        supplierId: dto.supplierId,
        reorderLevel: dto.reorderLevel ?? undefined,
        lowStockWarn: dto.lowStockWarn ?? undefined,
        gradient: dto.gradient ?? null,
        remark: dto.remark ?? null,
        colorCode: dto.colorCode ?? undefined,
      },
      include: { supplier: true },
    });
  }

  // GET ALL ITEMS (optional search/filter)
  listItems(_user: any, opts?: { q?: string; supplierId?: number; category?: string; barcode?: string }) {
    const where: any = {};
    if (opts?.q) where.name = { contains: opts.q, mode: 'insensitive' };
    if (opts?.supplierId) where.supplierId = opts.supplierId;
    if (opts?.category) where.category = { equals: opts.category, mode: 'insensitive' };
    if (opts?.barcode) where.barcode = opts.barcode;

    return this.prisma.item.findMany({
      where,
      orderBy: { id: 'desc' },
      include: { supplier: true },
    });
  }

  // UPDATE ITEM
  async updateItem(_user: any, id: number, dto: UpdateItemDto) {
    const existing = await this.prisma.item.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Item not found');

    if (dto.supplierId !== undefined) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: dto.supplierId },
        select: { id: true },
      });
      if (!supplier) throw new NotFoundException('Supplier not found');
    }

    return this.prisma.item.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        barcode: dto.barcode ?? undefined,
        unit: dto.unit ?? undefined,
        category: dto.category ?? undefined,
        status: dto.status ?? undefined,
        cost: dto.cost ?? undefined,
        markup: dto.markup ?? undefined,
        salePrice: dto.salePrice ?? undefined,
        supplierId: dto.supplierId ?? undefined,
        reorderLevel: dto.reorderLevel ?? undefined,
        lowStockWarn: dto.lowStockWarn ?? undefined,
        gradient: dto.gradient ?? undefined, // keep null if passed null
        remark: dto.remark ?? undefined,
        colorCode: dto.colorCode ?? undefined,
      },
      include: { supplier: true },
    });
  }

  // GET ITEM BY ID
  async getItem(_user: any, id: number) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: { supplier: true },
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }
}
