// src/suppliers/services/supplier.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  // Create a new supplier
  async create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: dto, // Make sure the DTO matches Prisma's expectations
    });
  }

  // Find all suppliers
  async findAll() {
    return this.prisma.supplier.findMany();
  }

  // Find a supplier by ID
  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  // Update supplier by ID
  async update(id: number, dto: UpdateSupplierDto) {
    return this.prisma.supplier.update({
      where: { id },
      data: dto, // Ensure the DTO matches the Prisma schema
    });
  }

  // Delete supplier by ID
  async remove(id: number) {
    return this.prisma.supplier.delete({ where: { id } });
  }

  // Update supplier status (active or inactive)
  async updateStatus(id: number, active: boolean) {
    return this.prisma.supplier.update({
      where: { id },
      data: {
        status: active ? 'ACTIVE' : 'INACTIVE', // Map boolean to enum
      },
    });
  }
}
