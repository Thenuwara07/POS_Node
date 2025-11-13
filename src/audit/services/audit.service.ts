import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuthLogDto } from '../dto/create-auth-log.dto';
import { QueryAuthLogDto } from '../dto/query-auth-log.dto';
import { Prisma } from '../../../generated/prisma-client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  private nowMs() { return Date.now(); }

  async logAuth(dto: CreateAuthLogDto, req?: any) {
    const ip =
      dto.ip ??
      req?.ip ??
      req?.headers?.['x-forwarded-for']?.toString()?.split(',')[0]?.trim() ??
      req?.socket?.remoteAddress ??
      undefined;

    const userAgent = dto.userAgent ?? req?.headers?.['user-agent'];

    const rec = await this.prisma.authLog.create({
      data: {
        action: dto.action,
        timestamp: BigInt(dto.timestamp ?? this.nowMs()),
        userId: dto.userId ?? (req?.user?.id ? Number(req.user.id) : null),
        email: dto.email ?? req?.user?.email ?? null,
        ip,
        userAgent,
        meta: dto.meta as Prisma.InputJsonValue | undefined,
      },
    });

    return rec;
  }

  async listAuth(query: QueryAuthLogDto) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, query.pageSize ?? 25));
    const where: Prisma.AuthLogWhereInput = {
      userId: query.userId,
      action: query.action,
      AND: [
        query.fromTs ? { timestamp: { gte: BigInt(query.fromTs) } } : {},
        query.toTs ? { timestamp: { lte: BigInt(query.toTs) } } : {},
      ],
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.authLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      }),
      this.prisma.authLog.count({ where }),
    ]);

    return {
      total,
      page,
      pageSize,
      items,
    };
  }

  /** convenience for "my history" */
  async listMyAuth(userId: number, query: Omit<QueryAuthLogDto, 'userId'> = {}) {
    return this.listAuth({ ...query, userId });
  }
}
