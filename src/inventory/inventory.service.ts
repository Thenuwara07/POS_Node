import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ItemDto } from './dto/total-items.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getAllItems(): Promise<ItemDto[]> {
    const items = await this.prisma.item.findMany({
      include: {
        category: true,  // Include category info
        supplier: true,  // Include supplier info
      },
      orderBy: { id: 'asc' },
    });

    // Map Prisma model to DTO
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      barcode: item.barcode,
      category: {
        id: item.category.id,
        category: item.category.category,
        colorCode: item.category.colorCode,
      },
      supplier: {
        id: item.supplier.id,
        name: item.supplier.name,
        contact: item.supplier.contact,
        colorCode: item.supplier.colorCode,
      },
      reorderLevel: item.reorderLevel,
      gradient: item.gradient ?? undefined,
      remark: item.remark ?? undefined,
      colorCode: item.colorCode,
    }));
  }
}
