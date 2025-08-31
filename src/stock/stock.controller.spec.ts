
import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateItemDto } from './dto/update-item.dto';




  const mockStockService = {
    createCategory: jest.fn(),
    createItem: jest.fn(),
    handlePurchaseRequest: jest.fn(),
    updateItem: jest.fn(),
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



  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCategory', () => {
    it('should successfully create a category', async () => {
      const dto: CreateCategoryDto = { category: 'Electronics', colorCode: '#FF5733' };
      mockStockService.createCategory.mockResolvedValue(dto);

      expect(await controller.createCategory(dto)).toEqual(dto);
      expect(mockStockService.createCategory).toHaveBeenCalledWith(dto);
    });

    it('should throw an error if category creation fails', async () => {
      const dto: CreateCategoryDto = { category: 'Electronics', colorCode: '#FF5733' };
      mockStockService.createCategory.mockRejectedValue(new Error('Error'));

      await expect(controller.createCategory(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('createItem', () => {
    it('should successfully create an item', async () => {
      const dto: CreateItemDto = {
        name: 'Laptop',
        barcode: 'L001',
        categoryId: 1,
        supplierId: 1,
      };
      mockStockService.createItem.mockResolvedValue(dto);

      expect(await controller.createItem(dto)).toEqual(dto);
      expect(mockStockService.createItem).toHaveBeenCalledWith(dto);
    });

    it('should throw an error if item creation fails', async () => {
      const dto: CreateItemDto = {
        name: 'Laptop',
        barcode: 'L001',
        categoryId: 1,
        supplierId: 1,
      };
      mockStockService.createItem.mockRejectedValue(new Error('Error'));

      await expect(controller.createItem(dto)).rejects.toThrow(InternalServerErrorException);
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

      expect(await controller.handlePurchaseRequest(dto)).toEqual(dto);
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
      mockStockService.handlePurchaseRequest.mockRejectedValue(new Error('Error'));

      await expect(controller.handlePurchaseRequest(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

});

