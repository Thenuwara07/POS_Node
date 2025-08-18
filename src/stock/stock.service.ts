// src/stock/stock.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  // Create item
  async createItem(_stock: any, dto: CreateItemDto) {
    // Optional: ensure supplier exists (avoid orphan FK errors)
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
      select: { id: true },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    return this.prisma.item.create({
      data: {
        name: dto.name,
        supplierId: dto.supplierId,
        // undefined lets Prisma use the default if omitted
        colorCode: dto.colorCode ?? undefined,
      },
      include: { supplier: true }, // add { stock: true } if you need it
    });
  }

  // Update item
  async updateItem(_stock: any, id: number, dto: UpdateItemDto) {
    const existing = await this.prisma.item.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Item not found');

    // If supplierId is changing, validate it
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
        supplierId: dto.supplierId ?? undefined,
        colorCode: dto.colorCode ?? undefined,
      },
      include: { supplier: true },
    });
  }

  // List items with optional search & supplier filter
  listItems(_stock: any, opts?: { q?: string; supplierId?: number }) {
    const where: any = {};
    if (opts?.q) where.name = { contains: opts.q, mode: 'insensitive' };
    if (opts?.supplierId) where.supplierId = opts.supplierId;

    return this.prisma.item.findMany({
      where,
      orderBy: { id: 'desc' },
      include: { supplier: true },
    });
  }

  // Get one
  async getItem(_stock: any, id: number) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: { supplier: true },
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }
}
