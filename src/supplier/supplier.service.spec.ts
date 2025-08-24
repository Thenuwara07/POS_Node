import { Test, TestingModule } from '@nestjs/testing';
import { SupplierService } from './supplier.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { makeSupplierDto } from './test/factories/supplier.factory';


describe('SupplierService', () => {
  let service: SupplierService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: PrismaService,
          useValue: {
            supplier: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a supplier', async () => {
  const dto = makeSupplierDto();

  (prisma.supplier.create as jest.Mock).mockResolvedValue({ id: 1, ...dto });

  const result = await service.create(dto);

  expect(result).toEqual({ id: 1, ...dto });
  expect(prisma.supplier.create).toHaveBeenCalledWith({ data: dto });
});

  it('should return all suppliers', async () => {
    (prisma.supplier.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const result = await service.findAll();

    expect(result).toEqual([{ id: 1 }]);
    expect(prisma.supplier.findMany).toHaveBeenCalled();
  });

  it('should return one supplier if found', async () => {
    (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

    const result = await service.findOne(1);

    expect(result).toEqual({ id: 1 });
    expect(prisma.supplier.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('should throw NotFoundException if supplier not found', async () => {
    (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should update a supplier', async () => {
    const dto = { name: 'Updated' };
    (prisma.supplier.update as jest.Mock).mockResolvedValue({ id: 1, ...dto });

    const result = await service.update(1, dto);

    expect(result).toEqual({ id: 1, ...dto });
    expect(prisma.supplier.update).toHaveBeenCalledWith({ where: { id: 1 }, data: dto });
  });

  it('should delete a supplier', async () => {
    (prisma.supplier.delete as jest.Mock).mockResolvedValue({ id: 1 });

    const result = await service.remove(1);

    expect(result).toEqual({ id: 1 });
    expect(prisma.supplier.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
