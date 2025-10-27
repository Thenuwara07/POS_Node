import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import { hash } from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class ManagerService {
  constructor(private prisma: PrismaService) {}

  // ✅ Create a manager
  async create(dto: CreateManagerDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new BadRequestException('Email already exists');

    const now = new Date();
    const hashedPassword = dto.password ? await hash(dto.password, 10) : '';

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        contact: dto.contact,
        password: hashedPassword,
        role: (dto.role as Role) || Role.MANAGER,
        colorCode: dto.colorCode || '#000000',
        createdAt: now,
        updatedAt: now,
        createdBy: dto.createdBy ? { connect: { id: dto.createdBy } } : undefined,
      },
    });
  }

  // ✅ Get all managers
  async findAll(search?: string, role?: string, limit = 50, offset = 0) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contact: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    return this.prisma.user.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  // ✅ Get one manager
  async findOne(id: number) {
    const manager = await this.prisma.user.findUnique({ where: { id } });
    if (!manager) throw new NotFoundException('Manager not found');
    return manager;
  }

  // ✅ Update a manager
  async update(id: number, dto: UpdateManagerDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Manager not found');

    // Ensure unique email
    if (dto.email && dto.email.toLowerCase() !== existing.email.toLowerCase()) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (emailExists) throw new BadRequestException('Email already exists');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        email: dto.email?.toLowerCase() ?? existing.email,
        contact: dto.contact ?? existing.contact,
        password: dto.password ? await hash(dto.password, 10) : existing.password, // ✅ fixed field name
        role: (dto.role as Role) || Role.MANAGER,
        colorCode: dto.colorCode ?? existing.colorCode,
        updatedAt: new Date(),
      },
    });
  }

  // ✅ Delete a manager
  async remove(id: number) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Manager not found');
    return this.prisma.user.delete({ where: { id } });
  }

  // ✅ Verify login
  async verifyLogin(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return null;

    const candidateHash = await hash(password, 10);
    return user.password === candidateHash ? user : null;
  }

// ✅ Get trending items (based on reportAudit table)
async getTrendingItems(limit = 5, days = 7) {
  const fromTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;

  const trending = await this.prisma.reportAudit.groupBy({
    by: ['reportCode'], // ✅ camelCase
    where: { viewedAt: { gte: fromTimestamp } }, // ✅ camelCase
    _count: { reportCode: true }, // ✅ camelCase
    orderBy: { _count: { reportCode: 'desc' } }, // ✅ camelCase
    take: limit,
  });


  return trending.map((item) => ({
    reportCode: item.reportCode,
    views: item._count?.reportCode ?? 0,
  }));
}

  // 🔹 Get audit logs
  async getAuditLogs(
    userId?: number,
    reportCode?: string,
    limit = 20,
    offset = 0,
  ) {
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
  }
  
}
