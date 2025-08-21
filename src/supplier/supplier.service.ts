import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async findAll() {
    return this.prisma.supplier.findMany();
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(id: number, dto: UpdateSupplierDto) {
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    return this.prisma.supplier.delete({ where: { id } });
  }

  async updateStatus(id: number, active: boolean) {
  return this.prisma.supplier.update({
    where: { id },
    data: {
      status: active ? 'ACTIVE' : 'INACTIVE', // map boolean → enum
    },
  });
}

}
