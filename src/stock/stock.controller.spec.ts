import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemWithStockDto } from './dto/create-item-with-stock.dto';
import { CreateStockDto } from './dto/create-stock.dto';

describe('StockController', () => {
  let controller: StockController;
  let service: StockService;

  const mockStockService = {
    createCategory: jest.fn(),
    createItemWithStock: jest.fn(),
    handlePurchaseRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: StockService,
          useValue: mockStockService,
        },
      ],
    }).compile();

    controller = module.get<StockController>(StockController);
    service = module.get<StockService>(StockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCategory', () => {
    it('should successfully create a category', async () => {
      const dto: CreateCategoryDto = {
        category: 'Electronics',
        colorCode: '#FF5733',
      };
      mockStockService.createCategory.mockResolvedValue(dto);

      expect(await controller.createCategory(dto)).toEqual(dto);
      expect(mockStockService.createCategory).toHaveBeenCalledWith(dto);
    });

    it('should throw an error if category creation fails', async () => {
      const dto: CreateCategoryDto = {
        category: 'Electronics',
        colorCode: '#FF5733',
      };
      mockStockService.createCategory.mockRejectedValue(new Error('Error'));

      await expect(controller.createCategory(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('createItemWithStock', () => {
    it('should successfully create an item with stock', async () => {
      const dto: CreateItemWithStockDto = {
        name: 'Laptop',
        barcode: 'L001',
        categoryId: 1,
        supplierId: 1,
        reorderLevel: 5,
        gradient: 'linear(#0ea5e9, #22d3ee)',
        remark: 'Wireless mouse',
        colorCode: '#000000',
        quantity: 100,
        unitPrice: 450.0,
        sellPrice: 650.0,
      };
      const file: Express.Multer.File = { buffer: Buffer.from('sample'), originalname: 'test.png' } as any;
      mockStockService.createItemWithStock.mockResolvedValue(dto);

      expect(await controller.createItemWithStock(dto, file)).toEqual(dto);
      expect(mockStockService.createItemWithStock).toHaveBeenCalledWith(dto, file);
    });

    it('should throw an error if item creation fails', async () => {
      const dto: CreateItemWithStockDto = {
        name: 'Laptop',
        barcode: 'L001',
        categoryId: 1,
        supplierId: 1,
        reorderLevel: 5,
        gradient: 'linear(#0ea5e9, #22d3ee)',
        remark: 'Wireless mouse',
        colorCode: '#000000',
        quantity: 100,
        unitPrice: 450.0,
        sellPrice: 650.0,
      };
      const file: Express.Multer.File = { buffer: Buffer.from('sample'), originalname: 'test.png' } as any;
      mockStockService.createItemWithStock.mockRejectedValue(new Error('Error'));

      await expect(controller.createItemWithStock(dto, file)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('handlePurchaseRequest', () => {
    it('should successfully handle purchase request', async () => {
      const dto: CreateStockDto = {
        itemId: 1,
        quantity: 100,
        unitPrice: 10.0,
        sellPrice: 15.0,
        supplierId: 1,
      };
      mockStockService.handlePurchaseRequest.mockResolvedValue(dto);

      expect(await controller.createStock(dto)).toEqual(dto);
      expect(mockStockService.handlePurchaseRequest).toHaveBeenCalledWith(dto);
    });

    it('should throw an error if purchase request handling fails', async () => {
      const dto: CreateStockDto = {
        itemId: 1,
        quantity: 100,
        unitPrice: 10.0,
        sellPrice: 15.0,
        supplierId: 1,
      };
      mockStockService.handlePurchaseRequest.mockRejectedValue(
        new Error('Error'),
      );

      await expect(controller.createStock(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
