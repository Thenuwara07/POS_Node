import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemWithStockDto } from './dto/create-item-with-stock.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { ImageStorageService } from '../common/upload/image-storage.service';
import { GetAllItemsDto } from './dto/get-all-items.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { RestockDto } from './dto/restock.dto';
import { Prisma } from '../../generated/prisma';
import { RestockItemDto } from './dto/restock-item.dto';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageStorage: ImageStorageService,
  ) {}

  // ---------------------------------------------------------------------------------------------

  // ---- CATEGORY: Create (with optional image) ----
  async createCategory(
    dto: CreateCategoryDto,
    file?: Express.Multer.File,
    userId?: number,
  ) {
    this.logger.log(`Creating category: ${dto.category}`, {
      userId,
      hasFile: !!file,
      hasBase64: !!dto.imageBase64,
    });

    // resolve image path
    let imagePath: string | undefined;

    try {
      if (file) {
        this.logger.log('Processing file upload for category');
        const absPath = file.path.replace(/\\/g, '/');
        const idx = absPath.indexOf('/uploads/');
        imagePath = idx >= 0 ? absPath.slice(idx + 1) : absPath; // make it relative (uploads/..)
        this.logger.log(`File image path: ${imagePath}`);
      } else if (dto.imageBase64) {
        this.logger.log('Processing base64 image for category');
        imagePath = this.imageStorage.saveBase64CategoryImage(dto.imageBase64);
        this.logger.log(`Base64 image path: ${imagePath}`);
      }

      const color = dto.colorCode.startsWith('#')
        ? dto.colorCode.toUpperCase()
        : ('#' + dto.colorCode).toUpperCase();

      this.logger.log(`Creating category with color: ${color}`);

      const category = await this.prisma.category.create({
        data: {
          category: dto.category,
          colorCode: color,
          categoryImage: imagePath ?? null,
          createdById: userId ?? null,
        },
      });

      this.logger.log(`Category created successfully: ${category.id}`);
      return category;
    } catch (err) {
      this.logger.error(`Failed to create category: ${err.message}`, err.stack);
      this.handlePrismaError(err, 'createCategory');
    }
  }

  // ---------------------------------------------------------------------------------------------

  // ---- ITEM: Create with optional stock ----
  async createItemWithOptionalStock(
    dto: CreateItemWithStockDto,
    file?: Express.Multer.File,
    userId?: number,
  ) {
    this.logger.log(`Creating item: ${dto.name}`, {
      userId,
      hasFile: !!file,
      hasBase64: !!dto.imageBase64,
      categoryId: dto.categoryId,
      supplierId: dto.supplierId,
    });

    try {
      await this.ensureCategoryExists(dto.categoryId);
      this.logger.log(`Category ${dto.categoryId} exists`);

      await this.ensureSupplierExists(dto.supplierId);
      this.logger.log(`Supplier ${dto.supplierId} exists`);

      // Handle image (file OR base64)
      let imagePath: string | undefined;
      if (file) {
        this.logger.log('Processing file upload for item');
        const absPath = file.path.replace(/\\/g, '/');
        const uploadsIndex = absPath.indexOf('/uploads/');
        imagePath =
          uploadsIndex >= 0 ? absPath.slice(uploadsIndex + 1) : absPath;
        this.logger.log(`File image path: ${imagePath}`);
      } else if (dto.imageBase64) {
        this.logger.log('Processing base64 image for item');
        imagePath = this.imageStorage.saveBase64ItemImage(dto.imageBase64);
        this.logger.log(`Base64 image path: ${imagePath}`);
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

      this.logger.log(`Stock creation: ${shouldCreateStock ? 'YES' : 'NO'}`, {
        batchId,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        sellPrice: dto.sellPrice,
      });

      const result = await this.prisma.$transaction(async (tx) => {
        this.logger.log('Starting database transaction for item creation');

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
            createdById: userId ?? null,
          },
        });

        this.logger.log(`Item created successfully: ${item.id}`);

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
          this.logger.log(`Stock created successfully: ${createdStock.id}`);
        }

        return { item, stock: createdStock };
      });

      this.logger.log(`Item creation completed successfully for: ${dto.name}`);
      return result;
    } catch (err) {
      this.logger.error(`Failed to create item: ${err.message}`, err.stack);
      this.handlePrismaError(err, 'createItemWithOptionalStock');
    }
  }

  // ---------------------------------------------------------------------------------------------

  // ---- PURCHASE: Handle Supplier Request and Create Stock ----
  async handlePurchaseRequest(dto: CreateStockDto) {
    this.logger.log('Handling purchase request', {
      itemId: dto.itemId,
      supplierId: dto.supplierId,
      quantity: dto.quantity,
    });

    try {
      await this.ensureSupplierExists(dto.supplierId);
      await this.ensureItemExists(dto.itemId);

      const batchId = `${dto.itemId}-${Date.now()}`;

      this.logger.log(`Creating stock with batchId: ${batchId}`);

      const stock = await this.prisma.stock.create({
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

      this.logger.log(`Stock created successfully: ${stock.id}`);
      return stock;
    } catch (err) {
      this.logger.error(
        `Failed to handle purchase request: ${err.message}`,
        err.stack,
      );
      this.handlePrismaError(err, 'handlePurchaseRequest');
    }
  }

  // ---------------------------------------------------------------------------------------------

  // ---- Helpers ----
  private async ensureCategoryExists(categoryId: number) {
    this.logger.log(`Checking if category exists: ${categoryId}`);
    const exists = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!exists) {
      this.logger.error(`Category ${categoryId} does not exist`);
      throw new BadRequestException(`Category ${categoryId} does not exist`);
    }
  }

  private async ensureSupplierExists(supplierId: number) {
    this.logger.log(`Checking if supplier exists: ${supplierId}`);
    const exists = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!exists) {
      this.logger.error(`Supplier ${supplierId} does not exist`);
      throw new BadRequestException(`Supplier ${supplierId} does not exist`);
    }
  }

  private async ensureItemExists(itemId: number) {
    this.logger.log(`Checking if item exists: ${itemId}`);
    const exists = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!exists) {
      this.logger.error(`Item ${itemId} does not exist`);
      throw new BadRequestException(`Item ${itemId} does not exist`);
    }
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * Translate Prisma errors -> Nest HTTP exceptions
   */
  private handlePrismaError(err: unknown, ctx: string): never {
    this.logger.error(`Prisma error in ${ctx}:`, err);

    if (err instanceof PrismaClientKnownRequestError) {
      this.logger.error(`Prisma error code: ${err.code}`, err.meta);

      if (err.code === 'P2002') {
        const target = Array.isArray(err.meta?.target)
          ? (err.meta!.target as string[]).join(', ')
          : ((err.meta?.target as string) ?? 'unique field');
        this.logger.error(`Duplicate entry for: ${target}`);
        throw new ConflictException(`Duplicate value for ${target}`);
      }
      if (err.code === 'P2003') {
        this.logger.error(`Foreign key constraint failed: ${err.meta}`);
        throw new BadRequestException(`Invalid relation provided (${ctx}).`);
      }
      if (err.code === 'P2025') {
        this.logger.error(`Record not found: ${err.meta}`);
        throw new NotFoundException(`Requested resource not found (${ctx}).`);
      }
    }

    // For debugging, include the actual error message
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred';
    this.logger.error(`Unexpected error in ${ctx}: ${errorMessage}`);
    throw new InternalServerErrorException(
      `Unexpected error occurred: ${errorMessage}`,
    );
  }

  // ---------------------------------------------------------------------------------------------

  // GET all categories (alphabetical)
  async listCategories() {
    this.logger.log('Fetching all categories');
    try {
      const categories = await this.prisma.category.findMany({
        orderBy: { category: 'asc' },
      });
      this.logger.log(`Found ${categories.length} categories`);
      return categories;
    } catch (err) {
      this.logger.error('Failed to fetch categories', err.stack);
      throw new InternalServerErrorException('Failed to fetch categories');
    }
  }

  // ---------------------------------------------------------------------------------------------

  // ---- ITEM: Update ----
  async updateItem(
    itemId: number,
    dto: UpdateItemDto,
    file?: Express.Multer.File,
    userId?: number,
  ) {
    this.logger.log(`Updating item ID: ${itemId}`, {
      userId,
      hasFile: !!file,
      hasBase64: !!dto.imageBase64,
    });

    try {
      const existing = await this.prisma.item.findUnique({
        where: { id: itemId },
      });
      if (!existing) {
        this.logger.warn(`Item not found: ${itemId}`);
        throw new NotFoundException(`Item ID ${itemId} not found`);
      }

      // Validate foreign keys if provided
      if (dto.categoryId) await this.ensureCategoryExists(dto.categoryId);
      if (dto.supplierId) await this.ensureSupplierExists(dto.supplierId);

      // Handle new image if uploaded or base64 provided
      let imagePath = existing.imagePath;
      if (file) {
        const absPath = file.path.replace(/\\/g, '/');
        const idx = absPath.indexOf('/uploads/');
        imagePath = idx >= 0 ? absPath.slice(idx + 1) : absPath;
        this.logger.log(`Updated image file path: ${imagePath}`);
      } else if (dto.imageBase64) {
        imagePath = this.imageStorage.saveBase64ItemImage(dto.imageBase64);
        this.logger.log(`Updated base64 image path: ${imagePath}`);
      }

      const updatedItem = await this.prisma.item.update({
        where: { id: itemId },
        data: {
          name: dto.name ?? existing.name,
          barcode: dto.barcode ?? existing.barcode,
          categoryId: dto.categoryId ?? existing.categoryId,
          supplierId: dto.supplierId ?? existing.supplierId,
          reorderLevel: dto.reorderLevel ?? existing.reorderLevel,
          colorCode: dto.colorCode ?? existing.colorCode,
          remark: dto.remark ?? existing.remark,
          imagePath,
          createdById: userId ?? existing.createdById,
        },
      });

      this.logger.log(`Item updated successfully in DB: ${updatedItem.id}`);
      return updatedItem;
    } catch (err) {
      this.logger.error(`Failed to update item: ${err.message}`, err.stack);
      this.handlePrismaError(err, 'updateItem');
    }
  }

  // ---------------------------------------------------------------------------------------------

  //Get all items details for Stock
  
async listItems(): Promise<GetAllItemsDto[]> {
  this.logger.log('Listing items (one row per batch; empty row if no stock)');

  // small helpers (local to this method)
  const asNonNegativeInt = (v: unknown) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.trunc(n);
  };
  const asNonNegative = (v: unknown) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return 0;
    return n;
  };
  const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

  try {
    const items = await this.prisma.item.findMany({
      include: {
        category: { select: { category: true } },
        createdBy: { select: { name: true } },
        stock: {
          select: {
            id: true,
            batchId: true,
            quantity: true,
            unitPrice: true,
            sellPrice: true,
          },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    const rows: GetAllItemsDto[] = [];

    for (const it of items) {
      const base = {
        itemId: it.id,
        name: it.name,
        categoryName: it.category?.category ?? '(Uncategorized)',
        createdBy: it.createdBy?.name ?? null,
        status: it.status,
      };

      if (!it.stock || it.stock.length === 0) {
        rows.push({
          ...base,
          stockId: null,
          batchId: null,
          qty: 0,
          unitPrice: 0,
          sellPrice: 0,
          total: 0,
        });
        continue;
      }

      for (const s of it.stock) {
        const qty = asNonNegativeInt(s.quantity);
        const unit = asNonNegative(s.unitPrice);
        const sell = asNonNegative(s.sellPrice);
        rows.push({
          ...base,
          stockId: s.id,
          batchId: s.batchId,
          qty,
          unitPrice: unit,
          sellPrice: sell,
          total: round2(qty * sell),
        });
      }
    }

    return rows;
  } catch (err) {
    this.logger.error('Failed to list items', err instanceof Error ? err.stack : undefined);
    // your central mapper throws the right Nest exception
    this.handlePrismaError(err, 'listItems');
  }
}


  // -----------------------------------------------------------------------------------------------------

  // ---- ITEM: Set status (0=disabled, 1=enabled) ----
  async setItemStatus(itemId: number, status: number, userId?: number) {
    this.logger.log(
      `setItemStatus: itemId=${itemId}, status=${status}, userId=${userId}`,
    );

    if (status !== 0 && status !== 1) {
      throw new BadRequestException('status must be 0 or 1');
    }

    const existing = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, status: true },
    });
    if (!existing) {
      this.logger.warn(`Item not found: ${itemId}`);
      throw new NotFoundException(`Item ID ${itemId} not found`);
    }

    if (existing.status === status) {
      this.logger.log(`Item ${itemId} already in desired status ${status}`);
      return { id: existing.id, status: existing.status, unchanged: true };
    }

    const updated = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        status,
        // (Optional) updatedById: userId,
      },
      select: {
        id: true,
        name: true,
        status: true,
        categoryId: true,
        supplierId: true,
      },
    });

    this.logger.log(`Item ${itemId} status updated => ${status}`);
    return updated;
  }

  // ---------------------------------------------------------------------------------------------------------

  // ---- ITEMS: List by status with your existing summary projection ----
  // ---- ITEMS: List by status (0/1) returning one row per (item, stock batch) ----
  async listItemsByStatus(status: 0 | 1): Promise<GetAllItemsDto[]> {
    this.logger.log(`Fetching items by status=${status}`);

    try {
      const items = await this.prisma.item.findMany({
        where: { status },
        include: {
          category: { select: { category: true } },
          createdBy: { select: { name: true } },
          stock: {
            select: {
              id: true,
              batchId: true,
              quantity: true,
              unitPrice: true,
              sellPrice: true,
            },
            orderBy: { id: 'asc' },
          },
        },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      });

      const rows: GetAllItemsDto[] = [];

      for (const it of items) {
        const base = {
          itemId: it.id,
          name: it.name,
          categoryName: it.category?.category ?? '(Uncategorized)',
          createdBy: it.createdBy?.name ?? null,
          status: it.status ?? 0,
        };

        if (!it.stock || it.stock.length === 0) {
          // If no stock, return a single placeholder row so UI can still render the item
          rows.push({
            ...base,
            stockId: null,
            batchId: null,
            qty: 0,
            unitPrice: 0,
            sellPrice: 0,
            total: 0,
          });
          continue;
        }

        for (const s of it.stock) {
          const qty =
            Number.isFinite(s.quantity) && s.quantity > 0
              ? Math.trunc(s.quantity)
              : 0;
          const unit =
            Number.isFinite(s.unitPrice) && s.unitPrice > 0 ? s.unitPrice : 0;
          const sell =
            Number.isFinite(s.sellPrice) && s.sellPrice > 0 ? s.sellPrice : 0;
          const total = Math.round(qty * sell * 100) / 100;

          rows.push({
            ...base,
            stockId: s.id,
            batchId: s.batchId,
            qty,
            unitPrice: unit,
            sellPrice: sell,
            total,
          });
        }
      }

      return rows;
    } catch (err) {
      this.logger.error(
        'Failed to fetch items by status',
        err instanceof Error ? err.stack : undefined,
      );
      // If you have your centralized mapper:
      // return this.handlePrismaError(err, 'listItemsByStatus');
      throw new InternalServerErrorException('Failed to fetch items by status');
    }
  }



  


  // -----------------------------------------------------------------------------








  // LookUp for restock

  async lookupItemForRestock(q: string): Promise<RestockDto> {
  // Try to interpret q
  const isNumericId = /^\d+$/.test(q);
  const whereOr: Prisma.ItemWhereInput[] = [
    { barcode: q },                                        // exact barcode
    { name: { contains: q, mode: 'insensitive' } },        // partial name
  ];
  if (isNumericId) whereOr.unshift({ id: Number(q) });     // numeric id first

  const item = await this.prisma.item.findFirst({
    where: { OR: whereOr },
    include: {
      category: { select: { category: true } },
      createdBy: { select: { name: true } },
      stock: {
        select: { id: true, batchId: true, quantity: true, unitPrice: true, sellPrice: true ,supplierId: true},
        orderBy: { id: 'desc' }, // newest first
      },
    },
  });

  if (!item) throw new NotFoundException('No matching item found');

  // Aggregate current quantity
  const totalQty = item.stock.reduce((sum, s) => sum + (Number.isFinite(s.quantity) ? s.quantity : 0), 0);

  // Use most recent batch prices (if any)
  const latest = item.stock[0];
  const unitPrice = latest?.unitPrice ?? 0;
  const sellPrice = latest?.sellPrice ?? 0;
  const latestSupplierId = latest?.supplierId ?? null; // if exists, supplierId; else null
  const latestBatchId = latest?.batchId ?? null;

  const dto: RestockDto = {
    itemId: item.id,
    name: item.name,
    categoryName: item.category?.category ?? '(Uncategorized)',
    createdBy: item.createdBy?.name ?? null,
    qty: totalQty,
    unitPrice,
    sellPrice,
    status: item.status ?? 0,
    // Not needed for lookup; UI will generate a new one at submit time
    batchId:latestBatchId,
    supplierId: latestSupplierId,
  };

  return dto;
}




// ----------------------------------------------------------------------------------





// Restock item (when sell price not eq new sell price it shoud be create new batchId and update stock. sell price eq new sellprice dont need to create
// new batchid you can update stock with same batchid)

async restockItem(itemId: number, dto: RestockItemDto) {
    this.logger.log('restockItem()', { itemId, dto });

    try {
      // Validate existence
      const item = await this.prisma.item.findUnique({
        where: { id: itemId },
        select: { id: true, supplierId: true },
      });
      if (!item) throw new NotFoundException(`Item ID ${itemId} not found`);

      // Validate supplier
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: dto.supplierId },
        select: { id: true },
      });
      if (!supplier) throw new NotFoundException(`Supplier ID ${dto.supplierId} not found`);

      // Latest batch for this item
      const latest = await this.prisma.stock.findFirst({
        where: { itemId },
        orderBy: { id: 'desc' },
      });

      // Helper: price equality with small tolerance
      const eq = (a: number, b: number) => Math.abs(a - b) < 1e-6;

      // No existing stock -> must create a new batch (need both prices)
      if (!latest) {
        if (dto.sellPrice == null || dto.unitPrice == null) {
          throw new BadRequestException(
            'No existing batches: sellPrice and unitPrice are required to create the first batch.',
          );
        }
        const newBatchId = `${itemId}-${Date.now()}`;

        const created = await this.prisma.stock.create({
          data: {
            batchId: newBatchId,
            itemId,
            supplierId: dto.supplierId,
            quantity: dto.qty,
            unitPrice: dto.unitPrice,
            sellPrice: dto.sellPrice,
            discountAmount: 0,
          },
        });

        return {
          mode: 'new-batch',
          stockId: created.id,
          batchId: created.batchId,
          qtyAdded: dto.qty,
          unitPrice: created.unitPrice,
          sellPrice: created.sellPrice,
        };
      }

      // We have an existing "latest" batch
      const latestSell = latest.sellPrice;

      // Decide whether we append or create a new batch
      // Case A: sellPrice provided AND different from latest -> new batch
      if (dto.sellPrice != null && !eq(dto.sellPrice, latestSell)) {
        if (dto.unitPrice == null) {
          throw new BadRequestException(
            'Creating a new batch requires unitPrice when sellPrice differs from the latest batch.',
          );
        }
        const newBatchId = `${itemId}-${Date.now()}`;

        const created = await this.prisma.stock.create({
          data: {
            batchId: newBatchId,
            itemId,
            supplierId: dto.supplierId,
            quantity: dto.qty,
            unitPrice: dto.unitPrice,
            sellPrice: dto.sellPrice,
            discountAmount: 0,
          },
        });

        return {
          mode: 'new-batch',
          stockId: created.id,
          batchId: created.batchId,
          qtyAdded: dto.qty,
          unitPrice: created.unitPrice,
          sellPrice: created.sellPrice,
        };
      }

      // Case B: sellPrice not provided OR equals latest -> append to latest batch (no new batchId)
      const updated = await this.prisma.stock.update({
        where: { id: latest.id },
        data: {
          quantity: latest.quantity + dto.qty,
          // If unitPrice provided, update it; else keep as-is
          ...(dto.unitPrice != null ? { unitPrice: dto.unitPrice } : {}),
          // sellPrice stays same as latest
        },
      });

      return {
        mode: 'append-latest',
        stockId: updated.id,
        batchId: updated.batchId,
        qtyAdded: dto.qty,
        newQty: updated.quantity,
        unitPrice: updated.unitPrice,
        sellPrice: updated.sellPrice,
      };
    } catch (err) {
      this.logger.error('restockItem() failed', err instanceof Error ? err.stack : undefined);
      // Reuse your centralized mapper
      this.handlePrismaError(err, 'restockItem');
    }
  }





}
