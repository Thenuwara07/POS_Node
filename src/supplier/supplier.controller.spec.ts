import { Test, TestingModule } from '@nestjs/testing';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { makeSupplierDto } from './test/factories/supplier.factory';

describe('SupplierController', () => {
  let controller: SupplierController;
  let service: SupplierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierController],
      providers: [
        {
          provide: SupplierService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SupplierController>(SupplierController);
    service = module.get<SupplierService>(SupplierService);
  });

  it('should create a supplier', async () => {
    const dto = makeSupplierDto();

  (service.create as jest.Mock).mockResolvedValue({ id: 1, ...dto });

  expect(await controller.create(dto)).toEqual({ id: 1, ...dto });
  expect(service.create).toHaveBeenCalledWith(dto);
});

  it('should return all suppliers', async () => {
    (service.findAll as jest.Mock).mockResolvedValue([{ id: 1 }]);

    expect(await controller.findAll()).toEqual([{ id: 1 }]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should return one supplier', async () => {
    (service.findOne as jest.Mock).mockResolvedValue({ id: 1 });

    expect(await controller.findOne(1)).toEqual({ id: 1 });
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should update a supplier', async () => {
    const dto = { name: 'Updated' };
    (service.update as jest.Mock).mockResolvedValue({ id: 1, ...dto });

    expect(await controller.update(1, dto)).toEqual({ id: 1, ...dto });
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('should remove a supplier', async () => {
    (service.remove as jest.Mock).mockResolvedValue({ id: 1 });

    expect(await controller.remove(1)).toEqual({ id: 1 });
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
