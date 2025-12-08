// supplier/supplier.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '../../generated/prisma-client/runtime/library';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierStatus } from '../../generated/prisma-client';

@Injectable()
export class SupplierService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createSupplier(dto: CreateSupplierDto, userId?: number) {
    try {
      const color = dto.colorCode
        ? (dto.colorCode.startsWith('#') ? dto.colorCode : `#${dto.colorCode}`).toUpperCase()
        : '#000000';

      return await this.prisma.supplier.create({
        data: {
          name: dto.name,
          brand: dto.brand,
          contact: dto.contact,
          email: dto.email ?? null,
          address: dto.address ?? null,
          location: dto.location ?? null,
          notes: dto.notes ?? null,
          colorCode: color,
          status: dto.status ?? SupplierStatus.ACTIVE,
          preferred: dto.preferred ? 1 : 0, // Convert boolean to int (since preferred is Int in schema)
          active: dto.active ?? true, // Use boolean directly (since active is Boolean in schema)
          createdById: userId ?? null,
        },
      });

    } catch (err) {
      this.handlePrismaError(err, 'createSupplier');
    }
  }

  async listSuppliers() {
    return this.prisma.supplier.findMany({
      orderBy: [{ name: 'asc' }, { brand: 'asc' }],
    });
  }

  async getSupplierById(id: number) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return supplier;
  }

  async updateSupplier(id: number, dto: UpdateSupplierDto, userId?: number) {
    // ensure exists
    await this.getSupplierById(id);

    const color = dto.colorCode
      ? (dto.colorCode.startsWith('#') ? dto.colorCode : `#${dto.colorCode}`).toUpperCase()
      : undefined;

    try {
      const updateData: any = {
        name: dto.name,
        brand: dto.brand,
        contact: dto.contact,
        email: dto.email,
        address: dto.address,
        location: dto.location,
        notes: dto.notes,
        colorCode: color,
        updatedById: userId ?? null,
      };

      // Only include these fields if they are provided
      if (dto.status !== undefined) {
        updateData.status = dto.status;
      }
      if (dto.preferred !== undefined) {
        updateData.preferred = dto.preferred ? 1 : 0; // Convert boolean to int
      }
      if (dto.active !== undefined) {
        updateData.active = dto.active; // Use boolean directly
      }

      return await this.prisma.supplier.update({
        where: { id },
        data: updateData,
      });
    } catch (err) {
      this.handlePrismaError(err, 'updateSupplier');
    }
  }

  async deleteSupplier(id: number) {
    try {
      return await this.prisma.supplier.delete({ where: { id } });
    } catch (err) {
      this.handlePrismaError(err, 'deleteSupplier');
    }
  }

  private async ensureSupplierExists(supplierId: number) {
    const exists = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!exists)
      throw new BadRequestException(`Supplier ${supplierId} does not exist`);
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
}
