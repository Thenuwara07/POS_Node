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
    this.logger.log(`Creating category: ${dto.category}`, { userId, hasFile: !!file, hasBase64: !!dto.imageBase64 });

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
      supplierId: dto.supplierId
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
        imagePath = uploadsIndex >= 0 ? absPath.slice(uploadsIndex + 1) : absPath;
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
        sellPrice: dto.sellPrice
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
        if (shouldCreateStock && batchId && dto.quantity && dto.unitPrice && dto.sellPrice) {
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
      quantity: dto.quantity
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
      this.logger.error(`Failed to handle purchase request: ${err.message}`, err.stack);
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
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    this.logger.error(`Unexpected error in ${ctx}: ${errorMessage}`);
    throw new InternalServerErrorException(`Unexpected error occurred: ${errorMessage}`);
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





  async listItems(): Promise<GetAllItemsDto[]> {
    this.logger.log('Fetching all items with summaries');
    try {
      const items = await this.prisma.item.findMany({
        select: {
          id: true,
          name: true,
          reorderLevel: true,
          status: true,
          category: { select: { category: true } },
          createdBy: { select: { name: true, email: true } },
          stock: { select: { quantity: true, unitPrice: true, sellPrice: true } },
        },
        orderBy: { name: 'asc' },
      });

      this.logger.log(`Found ${items.length} items`);

      const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);

      const result = items.map<GetAllItemsDto>((it) => {
        // Aggregate stock
        const totalQty = it.stock.reduce((sum, s) => sum + s.quantity, 0);

        const sumCostQty = it.stock.reduce(
          (sum, s) => sum + s.unitPrice * s.quantity,
          0,
        );
        const sumSellQty = it.stock.reduce(
          (sum, s) => sum + s.sellPrice * s.quantity,
          0,
        );

        // Weighted-average prices (by quantity); 0 if no stock
        const unitCost = Number(safeDiv(sumCostQty, totalQty).toFixed(2));
        const salesPrice = Number(safeDiv(sumSellQty, totalQty).toFixed(2));

        // Total value using weighted-average sales price
        const total = Number((totalQty * salesPrice).toFixed(2));

        // Prefer creator name, then email, else null
        const createdBy = it.createdBy?.name ?? it.createdBy?.email ?? null;

        const status = it.status ?? 0;

        return {
          itemId: it.id,
          name: it.name,
          categoryName: it.category.category,
          createdBy,
          qty: totalQty,
          unitCost,
          salesPrice,
          status,
          total,
        };
      });

      this.logger.log('Successfully processed item summaries');
      return result;
    } catch (err) {
      this.logger.error('Failed to fetch item summaries', err.stack);
      throw new InternalServerErrorException('Failed to fetch item summaries');
    }
  }
}