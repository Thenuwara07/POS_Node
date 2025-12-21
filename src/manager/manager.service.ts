import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Logger,
  HttpException, // ✅ ADD
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import { hash, compare } from 'bcryptjs';
import { Prisma, Role } from '../../generated/prisma-client';
import { ManagerAuditLogsQueryDto } from './dto/manager-audit-logs-query.dto';

@Injectable()
export class ManagerService {
  private readonly logger = new Logger(ManagerService.name);

  constructor(private prisma: PrismaService) {}

  // ✅ Centralized Prisma error handler (FIXED: do not wrap HTTP exceptions)
  private handlePrismaError(error: unknown, context: string): never {
    // ✅ If we already threw Conflict/BadRequest/NotFound etc, keep it
    if (error instanceof HttpException) {
      throw error;
    }

    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Optional: make message nicer if we can detect the field
        const target = (error.meta as any)?.target;
        const targetStr = Array.isArray(target)
          ? target.join(',')
          : String(target ?? '');

        const t = targetStr.toLowerCase();

        if (t.includes('contact') || t.includes('phone')) {
          throw new ConflictException(
            "You can’t have two accounts with the same phone number.",
          );
        }
        if (t.includes('email')) {
          throw new ConflictException('Email already exists');
        }
        if (t.includes('nic')) {
          throw new ConflictException('NIC already exists');
        }

        throw new ConflictException(`Duplicate entry detected in ${context}`);
      }

      if (error.code === 'P2025') {
        throw new NotFoundException(`Record not found in ${context}`);
      }

      if (error.code === 'P2003') {
        throw new BadRequestException(`Invalid foreign key in ${context}`);
      }
    }

    this.logger.error(`Unexpected error in ${context}`, error as any);
    throw new InternalServerErrorException(`Unexpected error in ${context}`);
  }

  // =========================
  // ✅ Normalization Helpers
  // =========================

  private normalizeSriLankaMobile(contactRaw: string): string {
    const raw = (contactRaw ?? '').toString().trim().replace(/[\s-]/g, '');
    if (!raw) throw new BadRequestException('Contact is required');

    let digits = raw;

    if (digits.startsWith('+')) digits = digits.substring(1);
    if (digits.startsWith('0094')) digits = digits.substring(2); // 0094 -> 94
    if (digits.startsWith('94')) digits = digits.substring(2);
    if (digits.startsWith('0')) digits = digits.substring(1);

    if (!/^7\d{8}$/.test(digits)) {
      throw new BadRequestException(
        'Contact must be a valid Sri Lankan mobile number (e.g. 0771234567 or +94771234567).',
      );
    }

    return `+94${digits}`;
  }

  private normalizeSriLankaNIC(nicRaw?: string | null): string | null {
    if (nicRaw === undefined || nicRaw === null) return null;

    const nic = nicRaw.toString().trim();
    if (!nic) return null;

    if (/^\d{9}[vVxX]$/.test(nic))
      return nic.slice(0, 9) + nic.slice(9).toUpperCase();
    if (/^\d{12}$/.test(nic)) return nic;

    throw new BadRequestException(
      'NIC must be a valid Sri Lankan NIC (old: 123456789V, new: 200012345678).',
    );
  }

  // =========================
  // ✅ Uniqueness Helpers
  // =========================

  private async ensureUniqueForCreate(
    email: string,
    contact: string,
    nic: string | null,
  ) {
    const or: any[] = [{ email }, { contact }];
    if (nic) or.push({ nic });

    const duplicate = await this.prisma.user.findFirst({
      where: { OR: or },
      select: { id: true, email: true, contact: true, nic: true },
    });

    if (!duplicate) return;

    if (duplicate.email?.toLowerCase() === email) {
      throw new BadRequestException('Email already exists');
    }
    if (duplicate.contact === contact) {
      throw new ConflictException(
        "You can’t have two accounts with the same phone number.",
      );
    }
    if (nic && duplicate.nic === nic) {
      throw new ConflictException('NIC already exists');
    }

    throw new ConflictException('Duplicate entry detected');
  }

  private async ensureUniqueForUpdate(
    id: number,
    email: string,
    contact: string,
    nic: string | null,
  ) {
    const or: any[] = [{ email }, { contact }];
    if (nic) or.push({ nic });

    const duplicate = await this.prisma.user.findFirst({
      where: {
        AND: [{ id: { not: id } }, { OR: or }],
      },
      select: { id: true, email: true, contact: true, nic: true },
    });

    if (!duplicate) return;

    if (duplicate.email?.toLowerCase() === email) {
      throw new BadRequestException('Email already exists');
    }
    if (duplicate.contact === contact) {
      throw new ConflictException(
        "You can’t have two accounts with the same phone number.",
      );
    }
    if (nic && duplicate.nic === nic) {
      throw new ConflictException('NIC already exists');
    }

    throw new ConflictException('Duplicate entry detected');
  }

  // ✅ Create a manager
  async create(dto: CreateManagerDto, actorUserId?: number) {
    try {
      const now = new Date();

      const email = dto.email.toLowerCase();
      const contact = this.normalizeSriLankaMobile(dto.contact);
      const nic = this.normalizeSriLankaNIC(dto.nic) ?? null;

      await this.ensureUniqueForCreate(email, contact, nic);

      const hashedPassword = dto.password ? await hash(dto.password, 10) : '';

      const actorIdRaw = Number(actorUserId ?? dto.createdBy ?? NaN);
      const actorId =
        Number.isInteger(actorIdRaw) && actorIdRaw > 0 ? actorIdRaw : null;

      return await this.prisma.user.create({
        data: {
          name: dto.name,
          email,
          contact,
          nic,
          password: hashedPassword,
          role: (dto.role as Role) || Role.MANAGER,
          colorCode: dto.colorCode || '#000000',
          createdAt: now,
          updatedAt: now,
          ...(actorId ? { createdById: actorId, updatedById: actorId } : {}),
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
          { nic: { contains: search, mode: 'insensitive' } },
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

  async findOne(id: number) {
    try {
      const manager = await this.prisma.user.findUnique({ where: { id } });
      if (!manager) throw new NotFoundException('Manager not found');
      return manager;
    } catch (err) {
      this.handlePrismaError(err, 'findOneManager');
    }
  }

  async update(id: number, dto: UpdateManagerDto, actorUserId?: number) {
    try {
      const existing = await this.prisma.user.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('User not found');

      const nextEmail = dto.email ? dto.email.toLowerCase() : existing.email;

      const nextContact = dto.contact
        ? this.normalizeSriLankaMobile(dto.contact)
        : existing.contact;

      const nextNic =
        dto.nic !== undefined
          ? this.normalizeSriLankaNIC(dto.nic)
          : (existing.nic ?? null);

      await this.ensureUniqueForUpdate(id, nextEmail, nextContact, nextNic);

      const normalizedRole =
        dto.role !== undefined
          ? (() => {
              const roleUpper = dto.role.toUpperCase() as Role;
              if (!(Object.values(Role) as string[]).includes(roleUpper)) {
                throw new BadRequestException('Invalid role');
              }
              return roleUpper;
            })()
          : existing.role;

      const actorIdRaw = Number(actorUserId ?? NaN);
      const actorId =
        Number.isInteger(actorIdRaw) && actorIdRaw > 0 ? actorIdRaw : null;

      return await this.prisma.user.update({
        where: { id },
        data: {
          name: dto.name ?? existing.name,
          email: nextEmail,
          contact: nextContact,
          nic: nextNic,
          password: dto.password ? await hash(dto.password, 10) : existing.password,
          role: normalizedRole,
          colorCode: dto.colorCode ?? existing.colorCode,
          updatedAt: new Date(),
          ...(actorId ? { updatedById: actorId } : {}),
        },
      });
    } catch (err) {
      this.handlePrismaError(err, 'updateUser');
    }
  }

  async remove(id: number) {
    try {
      const existing = await this.prisma.user.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('User not found');
      return await this.prisma.user.delete({ where: { id } });
    } catch (err) {
      this.handlePrismaError(err, 'removeUser');
    }
  }

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

  async getAuditLogs(query: ManagerAuditLogsQueryDto) {
    try {
      const limit = Math.min(200, Math.max(1, query.limit ?? 50));
      const offset = Math.max(0, query.offset ?? 0);

      const andFilters: Prisma.AuthLogWhereInput[] = [];
      if (query.fromTs) andFilters.push({ timestamp: { gte: BigInt(query.fromTs) } });
      if (query.toTs) andFilters.push({ timestamp: { lte: BigInt(query.toTs) } });

      const where: Prisma.AuthLogWhereInput = {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.action ? { action: query.action } : {}),
        ...(andFilters.length ? { AND: andFilters } : {}),
      };

      const [items, total] = await this.prisma.$transaction([
        this.prisma.authLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip: offset,
          take: limit,
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        }),
        this.prisma.authLog.count({ where }),
      ]);

      return { total, limit, offset, items };
    } catch (err) {
      this.handlePrismaError(err, 'getAuditLogs');
    }
  }

  async findAllItems() {
    try {
      return await this.prisma.item.findMany({
        orderBy: { id: 'desc' },
        select: {
          id: true,
          name: true,
          barcode: true,
          category: { select: { id: true, category: true } },
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
    } catch (err) {
      this.handlePrismaError(err, 'findAllItems');
    }
  }

  async findAllCustomers() {
    try {
      return await this.prisma.customer.findMany({
        orderBy: { id: 'desc' },
        select: { id: true, name: true, contact: true },
      });
    } catch (err) {
      this.handlePrismaError(err, 'findAllCustomers');
    }
  }

  async findAllUsers() {
    try {
      return await this.prisma.user.findMany({
        orderBy: { id: 'desc' },
        select: { id: true, name: true, email: true, nic: true, role: true, createdAt: true },
      });
    } catch (err) {
      this.handlePrismaError(err, 'findAllUsers');
    }
  }

  async findAllSuppliers() {
    try {
      return await this.prisma.supplier.findMany({
        orderBy: { id: 'desc' },
        select: { id: true, name: true, contact: true, email: true, address: true, status: true },
      });
    } catch (err) {
      this.handlePrismaError(err, 'findAllSuppliers');
    }
  }

  async findAllStocks() {
    try {
      return await this.prisma.stock.findMany({
        orderBy: { id: 'desc' },
        select: {
          id: true,
          item: {
            select: {
              id: true,
              name: true,
              barcode: true,
              reorderLevel: true,
              category: { select: { id: true, category: true } },
            },
          },
          quantity: true,
        },
      });
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
          date: true,
          customer: { select: { name: true } },
          type: true,
          amount: true,
        },
      });

      return invoicesRaw.map((i) => {
        const n = typeof i.date === 'bigint' ? Number(i.date) : (i.date as number);
        const ms = n < 1e12 ? n * 1000 : n;
        return { ...i, date: new Date(ms).toISOString() };
      });
    } catch (err) {
      this.handlePrismaError(err, 'findAllInvoices');
    }
  }

  async findAllCardPayments() {
    try {
      const invoicesRaw = await this.prisma.payment.findMany({
        where: { type: 'CARD' },
        orderBy: { id: 'desc' },
        select: { id: true, saleInvoiceId: true, date: true, type: true, amount: true },
      });

      return invoicesRaw.map((i) => {
        const n = typeof i.date === 'bigint' ? Number(i.date) : (i.date as number);
        const ms = n < 1e12 ? n * 1000 : n;
        return { ...i, date: new Date(ms).toISOString() };
      });
    } catch (err) {
      this.handlePrismaError(err, 'findAllCardPayments');
    }
  }

  async findAllCashPayments() {
    try {
      const invoicesRaw = await this.prisma.payment.findMany({
        where: { type: 'CASH' },
        orderBy: { id: 'desc' },
        select: { id: true, saleInvoiceId: true, date: true, type: true, amount: true },
      });

      return invoicesRaw.map((i) => {
        const n = typeof i.date === 'bigint' ? Number(i.date) : (i.date as number);
        const ms = n < 1e12 ? n * 1000 : n;
        return { ...i, date: new Date(ms).toISOString() };
      });
    } catch (err) {
      this.handlePrismaError(err, 'findAllCashPayments');
    }
  }

  async findAllDailySales() {
    try {
      const invoicesRaw = await this.prisma.payment.findMany({
        orderBy: { id: 'desc' },
        select: {
          saleInvoiceId: true,
          date: true,
          customer: { select: { name: true } },
          type: true,
          amount: true,
        },
      });

      return invoicesRaw.map((i) => {
        const n = typeof i.date === 'bigint' ? Number(i.date) : (i.date as number);
        const ms = n < 1e12 ? n * 1000 : n;
        return { ...i, date: new Date(ms).toISOString() };
      });
    } catch (err) {
      this.handlePrismaError(err, 'findAllInvoices');
    }
  }
}
