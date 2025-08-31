
// src/stock/stock.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { format } from 'date-fns';



  // ---- CATEGORY: Create ----
  async createCategory(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          category: dto.category,
          colorCode: dto.colorCode,
        },
      });
    } catch (err) {
      this.handlePrismaError(err, 'createCategory');
    }
  }


  // --- PURCHASE: Handle Supplier Request and Create Stock ---
  async handlePurchaseRequest(dto: CreateStockDto) {
    // Check if the supplier request is in 'PURCHASE' status
    const supplierRequest = await this.prisma.supplierRequestDetails.findFirst({
      where: {
        supplierId: dto.supplierId,
        status: 'PURCHASED',  // Check if the request status is 'PURCHASE'
      },
      include: { supplier: true },  // Include supplier info for batchId generation
    });

    if (!supplierRequest) {
      throw new BadRequestException('No purchase request found or invalid status');
    }

    // Generate a batch ID: current date + supplierId (e.g., 202508261 for supplier ID 1)
    const batchId = `${format(new Date(), 'yyyyMMdd')}${dto.supplierId}`;

    // Create the stock
    const stock = await this.prisma.stock.create({
      data: {
        batchId: batchId,
        itemId: dto.itemId,
        quantity: dto.quantity,  // Quantity from DTO
        unitPrice: dto.unitPrice,  // Unit price from DTO
        sellPrice: dto.sellPrice,  // Sell price from DTO
        supplierId: dto.supplierId,
      },
    });

    // Update the supplier request status to 'PURCHASE'
    await this.prisma.supplierRequestDetails.update({
      where: { id: supplierRequest.id },
      data: { status: 'PURCHASED' },
    });

    // Return the created stock as a response
    return stock;
  }






  // ---- ITEM: Create ----
  async createItem(dto: CreateItemDto) {
    // Validate foreign keys (early and explicit)
    await this.ensureCategoryExists(dto.categoryId);
    await this.ensureSupplierExists(dto.supplierId);

    try {
      return await this.prisma.item.create({
        data: {
          name: dto.name,
          barcode: dto.barcode,
          categoryId: dto.categoryId,
          supplierId: dto.supplierId,
          reorderLevel: dto.reorderLevel ?? undefined,
          gradient: dto.gradient ?? undefined,
          remark: dto.remark ?? undefined,
          colorCode: dto.colorCode ?? undefined, // DB default if undefined
        },
        include: { category: true, supplier: true },
      });
    } catch (err) {
      this.handlePrismaError(err, 'createItem');
    }
  }

  // ---- Helpers ----
  private async ensureCategoryExists(categoryId: number) {
    const exists = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!exists) throw new BadRequestException(`Category ${categoryId} does not exist`);
  }

  private async ensureSupplierExists(supplierId: number) {
    const exists = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!exists) throw new BadRequestException(`Supplier ${supplierId} does not exist`);
  }

  /**
   * Translate Prisma errors -> Nest HTTP exceptions
   */
  private handlePrismaError(err: unknown, ctx: string): never {
    if (err instanceof PrismaClientKnownRequestError) {
      // Unique constraint violation (e.g., barcode or category name)
      if (err.code === 'P2002') {
        // meta.target often contains the unique index fields
        const target = Array.isArray(err.meta?.target)
          ? (err.meta!.target as string[]).join(', ')
          : (err.meta?.target as string) ?? 'unique field';
        throw new ConflictException(`Duplicate value for ${target}`);
      }

      // Foreign key constraint failure (should be rare here due to ensure*Exists)
      if (err.code === 'P2003') {
        throw new BadRequestException(`Invalid relation provided (${ctx}).`);
      }

      // Record not found (usually on update/delete; included for completeness)
      if (err.code === 'P2025') {
        throw new NotFoundException(`Requested resource not found (${ctx}).`);
      }
    }

    // Fallback: hide internal details
    throw new InternalServerErrorException('Unexpected error occurred');
  }
}
