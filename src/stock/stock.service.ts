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
import { CreateItemWithStockDto } from './dto/create-item-with-stock.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { ImageStorageService } from '../common/upload/image-storage.service';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageStorage: ImageStorageService,
  ) {}

  // ---- CATEGORY: Create (with optional image) ----
  async createCategory(
    dto: CreateCategoryDto,
    file?: Express.Multer.File,
    userId?: number,
  ) {
    // resolve image path
    let imagePath: string | undefined;

    if (file) {
      const absPath = file.path.replace(/\\/g, '/');
      const idx = absPath.indexOf('/uploads/');
      imagePath = idx >= 0 ? absPath.slice(idx + 1) : absPath; // make it relative (uploads/..)
    } else if (dto.imageBase64) {
      imagePath = this.imageStorage.saveBase64CategoryImage(dto.imageBase64);
    }

    try {
      const color = dto.colorCode.startsWith('#')
        ? dto.colorCode.toUpperCase()
        : ('#' + dto.colorCode).toUpperCase();

      return await this.prisma.category.create({
        data: {
          category: dto.category,
          colorCode: color,
          categoryImage: imagePath ?? null,
          createdById: userId ?? null,
        },
      });
    } catch (err) {
      this.handlePrismaError(err, 'createCategory');
    }
  }

  // ---- ITEM: Create with optional stock ----
  async createItemWithOptionalStock(
    dto: CreateItemWithStockDto,
    file?: Express.Multer.File,
  ) {
    await this.ensureCategoryExists(dto.categoryId);
    await this.ensureSupplierExists(dto.supplierId);

    // Handle image (file OR base64)
    let imagePath: string | undefined;
    if (file) {
      const absPath = file.path.replace(/\\/g, '/');
      const uploadsIndex = absPath.indexOf('/uploads/');
      imagePath = uploadsIndex >= 0 ? absPath.slice(uploadsIndex + 1) : absPath;
    } else if (dto.imageBase64) {
      imagePath = this.imageStorage.saveBase64ItemImage(dto.imageBase64);
    }

    // Check if we should create initial stock
    const shouldCreateStock =
      dto.quantity &&
      dto.quantity > 0 &&
      dto.unitPrice &&
      dto.unitPrice > 0 &&
      dto.sellPrice &&
      dto.sellPrice > 0;

    const batchId = shouldCreateStock ? `${dto.barcode}-${Date.now()}` : null;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const item = await tx.item.create({
          data: {
            name: dto.name,
            barcode: dto.barcode ?? null,
            categoryId: dto.categoryId,
            supplierId: dto.supplierId,
            reorderLevel: dto.reorderLevel ?? 0,
            gradient: dto.gradient ?? null,
            remark: dto.remark ?? null,
            colorCode: dto.colorCode ?? '#000000',
            imagePath: imagePath ?? null,
            createdById: 1, // TODO: replace with JWT user id if needed
          },
        });

        let createdStock: any = null;
        if (
          shouldCreateStock &&
          batchId &&
          dto.quantity &&
          dto.unitPrice &&
          dto.sellPrice
        ) {
          createdStock = await tx.stock.create({
            data: {
              batchId,
              itemId: item.id,
              quantity: dto.quantity,
              unitPrice: dto.unitPrice,
              sellPrice: dto.sellPrice,
              supplierId: dto.supplierId,
              discountAmount: 0,
            },
          });
        }

        return { item, stock: createdStock };
      });
    } catch (err) {
      this.handlePrismaError(err, 'createItemWithOptionalStock');
    }
  }

  // ---- PURCHASE: Handle Supplier Request and Create Stock ----
  async handlePurchaseRequest(dto: CreateStockDto) {
    await this.ensureSupplierExists(dto.supplierId);
    await this.ensureItemExists(dto.itemId);

    const batchId = `${dto.itemId}-${Date.now()}`;

    try {
      return await this.prisma.stock.create({
        data: {
          batchId,
          itemId: dto.itemId,
          quantity: dto.quantity,
          unitPrice: dto.unitPrice,
          sellPrice: dto.sellPrice,
          supplierId: dto.supplierId,
          discountAmount: 0,
        },
      });
    } catch (err) {
      this.handlePrismaError(err, 'handlePurchaseRequest');
    }
  }

  // ---- Helpers ----
  private async ensureCategoryExists(categoryId: number) {
    const exists = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!exists)
      throw new BadRequestException(`Category ${categoryId} does not exist`);
  }

  private async ensureSupplierExists(supplierId: number) {
    const exists = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!exists)
      throw new BadRequestException(`Supplier ${supplierId} does not exist`);
  }

  private async ensureItemExists(itemId: number) {
    const exists = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!exists) throw new BadRequestException(`Item ${itemId} does not exist`);
  }

  /**
   * Translate Prisma errors -> Nest HTTP exceptions
   */
  private handlePrismaError(err: unknown, ctx: string): never {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const target = Array.isArray(err.meta?.target)
          ? (err.meta!.target as string[]).join(', ')
          : ((err.meta?.target as string) ?? 'unique field');
        throw new ConflictException(`Duplicate value for ${target}`);
      }
      if (err.code === 'P2003') {
        throw new BadRequestException(`Invalid relation provided (${ctx}).`);
      }
      if (err.code === 'P2025') {
        throw new NotFoundException(`Requested resource not found (${ctx}).`);
      }
    }
    throw new InternalServerErrorException('Unexpected error occurred');
  }

  // GET all categories (alphabetical)
  async listCategories() {
    return this.prisma.category.findMany({
      orderBy: { category: 'asc' },
    });
  }
}
