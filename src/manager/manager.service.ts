import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import { hash, compare } from 'bcryptjs';
import { Role } from '@prisma/client';


@Injectable()
export class ManagerService {
  private readonly logger = new Logger(ManagerService.name);

  constructor(private prisma: PrismaService) {}

  // 🔹 Centralized Prisma error handler
  private handlePrismaError(error: unknown, context: string): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new ConflictException(`Duplicate entry detected in ${context}`);
      if (error.code === 'P2025')
        throw new NotFoundException(`Record not found in ${context}`);
      if (error.code === 'P2003')
        throw new BadRequestException(`Invalid foreign key in ${context}`);
    }
    this.logger.error(`Unexpected error in ${context}`, error as any);
    throw new InternalServerErrorException(`Unexpected error in ${context}`);
  }

  // ✅ Create a manager
  async create(dto: CreateManagerDto) {
    try {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing) throw new BadRequestException('Email already exists');

      const now = new Date();
      const hashedPassword = dto.password ? await hash(dto.password, 10) : '';

      return await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          contact: dto.contact,
          password: hashedPassword,
          role: (dto.role as Role) || Role.MANAGER,
          colorCode: dto.colorCode || '#000000',
          createdAt: now,
          updatedAt: now,
          createdBy: dto.createdBy
            ? { connect: { id: dto.createdBy } }
            : undefined,
        },
      });
    } catch (err) {
      this.handlePrismaError(err, 'createManager');
    }

  }

  // ✅ Get all managers
  async findAll(search?: string, role?: string, limit = 50, offset = 0) {
    try {
      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { contact: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (role) where.role = role;

      return await this.prisma.user.findMany({
        where,
        orderBy: { id: 'desc' },
        take: limit,
        skip: offset,
      });
    } catch (err) {
      this.handlePrismaError(err, 'findAllManagers');
    }
  }

  // ✅ Get one manager
  async findOne(id: number) {
    try {
      const manager = await this.prisma.user.findUnique({ where: { id } });
      if (!manager) throw new NotFoundException('Manager not found');
      return manager;
    } catch (err) {
      this.handlePrismaError(err, 'findOneManager');
    }
  }

  // ✅ Update a manager
  async update(id: number, dto: UpdateManagerDto) {
    try {
      const existing = await this.prisma.user.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Manager not found');

      // Ensure unique email
      if (dto.email && dto.email.toLowerCase() !== existing.email.toLowerCase()) {
        const emailExists = await this.prisma.user.findUnique({
          where: { email: dto.email.toLowerCase() },
        });
        if (emailExists) throw new BadRequestException('Email already exists');
      }

      return await this.prisma.user.update({
        where: { id },
        data: {
          name: dto.name ?? existing.name,
          email: dto.email?.toLowerCase() ?? existing.email,
          contact: dto.contact ?? existing.contact,
          password: dto.password
            ? await hash(dto.password, 10)
            : existing.password,
          role: (dto.role as Role) || existing.role,
          colorCode: dto.colorCode ?? existing.colorCode,
          updatedAt: new Date(),
        },
      });
    } catch (err) {
      this.handlePrismaError(err, 'updateManager');
    }
  }

  // ✅ Delete a manager
  async remove(id: number) {
    try {
      const existing = await this.prisma.user.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Manager not found');
      return await this.prisma.user.delete({ where: { id } });
    } catch (err) {
      this.handlePrismaError(err, 'removeManager');
    }
  }

  // ✅ Verify login
  async verifyLogin(email: string, password: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (!user) return null;

      const isMatch = await compare(password, user.password);
      return isMatch ? user : null;
    } catch (err) {
      this.handlePrismaError(err, 'verifyLogin');
    }
  }

  // ✅ Get trending items (based on reportAudit table)
  async getTrendingItems(limit = 5, days = 7) {
    try {
      const fromTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;

      const trending = await this.prisma.reportAudit.groupBy({
        by: ['reportCode'],
        where: { viewedAt: { gte: fromTimestamp } },
        _count: { reportCode: true },
        orderBy: { _count: { reportCode: 'desc' } },
        take: limit,
      });

      return trending.map((item) => ({
        reportCode: item.reportCode,
        views: item._count?.reportCode ?? 0,
      }));
    } catch (err) {
      this.handlePrismaError(err, 'getTrendingItems');
    }
  }

  // ✅ Get audit logs
  async getAuditLogs(userId?: number, reportCode?: string, limit = 20, offset = 0) {
    try {
      const where: any = {};
      if (userId) where.userId = Number(userId);
      if (reportCode) where.reportCode = reportCode;

      const logs = await this.prisma.reportAudit.findMany({
        where,
        orderBy: { viewedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      return logs;
    } catch (err) {
      this.handlePrismaError(err, 'getAuditLogs');
    }
  }

  async findAllItems() {
    try {
      const items = await this.prisma.item.findMany({
        orderBy: { id: 'desc' },
        select: {
          id: true,
          name: true,
          barcode: true,
          category: { 
            select: { id: true, category: true } 
          },
          stock: {
            select: {
              itemId: true,
              quantity: true,
              unitPrice: true,
              sellPrice: true,
            },
          },
        },
      });

      return items;
    } catch (err) {
      this.handlePrismaError(err, 'findAllItems');
    }
  }

  async findAllCustomers() {
    try {
      const customers = await this.prisma.customer.findMany({
        orderBy: { id: 'desc' },
        select: {
          id: true,
          name: true,
          contact: true,
        },
      });

      return customers;
    } catch (err) {
      this.handlePrismaError(err, 'findAllCustomers');
    }
  }

  async findAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        orderBy: { id: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return users;
    } catch (err) {
      this.handlePrismaError(err, 'findAllUsers');
    }
  }


  async findAllSuppliers() {
    try {
      const suppliers = await this.prisma.supplier.findMany({
        orderBy: { id: 'desc' },
        select: {
          id: true,
          name: true,
          contact: true,
          email: true,
          address: true,
          status: true,
        },
      });

      return suppliers;
    } catch (err) {
      this.handlePrismaError(err, 'findAllSuppliers');
    }
  }

  async findAllStocks() {
    try {
      const stocks = await this.prisma.stock.findMany({
        orderBy: { id: 'desc' },
        select: {
          id: true,
          item: { 
            select: { 
              id: true,
              name: true,
              barcode: true,
              reorderLevel: true,
              category: { 
                select: { id: true, category: true } 
              },
            } 
          },
          quantity: true,

        },
      });

      return stocks;
    } catch (err) {
      this.handlePrismaError(err, 'findAllStocks');
    }
  }

  async findAllInvoices() {
    try {
      const invoicesRaw = await this.prisma.payment.findMany({
        orderBy: { id: 'desc' },
        select: {
          id: true,
          saleInvoiceId: true,
          date: true, // bigint epoch (likely seconds)
          customer: { select: { name: true } },
          type: true,
          amount: true,
        },
      });

      // Convert epoch (seconds or ms) -> ISO string
      const invoices = invoicesRaw.map((i) => {
        const n = typeof i.date === 'bigint' ? Number(i.date) : (i.date as number);
        const ms = n < 1e12 ? n * 1000 : n; // 10 digits => seconds, 13 => ms
        return {
          ...i,
          date: new Date(ms).toISOString(),
        };
      });

      return invoices;
    } catch (err) {
      this.handlePrismaError(err, 'findAllInvoices');
    }
  }

}
