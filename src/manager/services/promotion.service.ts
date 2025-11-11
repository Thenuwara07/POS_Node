import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePromotionDto,
  PromotionType,
  ScopeKind,
} from '../dto/create-promotion.dto';
import { UpdatePromotionDto } from '../dto/update-promotion.dto';

function b2i(b?: boolean): 0 | 1 | undefined {
  return b === undefined ? undefined : (b ? 1 : 0);
}

function daysToString(days?: number[]): string | null | undefined {
  if (days === undefined) return undefined;
  if (!days || days.length === 0) return null;
  return days.sort((a, b) => a - b).join(',');
}

/** serializes scopeValue:
 *  - ALL => ''
 *  - ITEM/CATEGORY => '1,2,3'
 *  - BUY_X_GET_Y => JSON string if first element is object
 */
function serializeScopeValue(
  dto: CreatePromotionDto | UpdatePromotionDto,
): string | undefined {
  if (dto.scopeKind === ScopeKind.ALL) return '';
  if (!dto.scopeValue || dto.scopeValue.length === 0) return '';
  const first = dto.scopeValue[0] as any;
  if (dto.type === PromotionType.BUY_X_GET_Y && typeof first === 'object') {
    return JSON.stringify(first);
  }
  return dto.scopeValue.map(String).join(',');
}

@Injectable()
export class PromotionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePromotionDto) {
    const now = BigInt(Date.now());
    return this.prisma.priceRule.create({
      data: {
        id: crypto.randomUUID(),
        name: dto.name,
        type: dto.type, // string column in DB
        scopeKind: dto.scopeKind, // string column in DB
        scopeValue: serializeScopeValue(dto) ?? '',
        value: Number(dto.value ?? 0),
        stackable: b2i(dto.stackable) ?? 1,
        active: b2i(dto.active) ?? 1,
        priority: dto.priority,
        perCustomerLimit: dto.perCustomerLimit ?? null,
        startTime: dto.startTime ?? null,
        endTime: dto.endTime ?? null,
        startDate: dto.startDate !== undefined ? BigInt(dto.startDate) : null,
        endDate: dto.endDate !== undefined ? BigInt(dto.endDate) : null,
        daysOfWeek: daysToString(dto.daysOfWeek) ?? null,
        createdAt: now,
        updatedAt: now,
        createdById: dto.createdById ?? null,
        updatedById: dto.createdById ?? null,
      },
    });
  }

  async findAll(params?: {
    q?: string;
    active?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, Number(params?.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(params?.pageSize ?? 20)));
    const where: any = {};

    if (typeof params?.active === 'boolean') where.active = b2i(params.active);
    if (params?.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { type: { contains: params.q, mode: 'insensitive' } },
        { scopeKind: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.priceRule.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.priceRule.count({ where }),
    ]);

    return {
      meta: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
      items,
    };
  }

  async findOne(id: string) {
    const rule = await this.prisma.priceRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Promotion not found');
    return rule;
  }

  async update(id: string, dto: UpdatePromotionDto) {
    await this.ensure(id);
    const now = BigInt(Date.now());

    return this.prisma.priceRule.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        scopeKind: dto.scopeKind,
        scopeValue:
          dto.scopeKind !== undefined || dto.scopeValue !== undefined
            ? serializeScopeValue(dto)
            : undefined,
        value: dto.value !== undefined ? Number(dto.value) : undefined,
        stackable: b2i(dto.stackable),
        active: b2i(dto.active),
        priority: dto.priority,
        perCustomerLimit:
          dto.perCustomerLimit === undefined ? undefined : dto.perCustomerLimit,
        startTime: dto.startTime ?? undefined,
        endTime: dto.endTime ?? undefined,
        startDate:
          dto.startDate === undefined ? undefined : BigInt(dto.startDate),
        endDate: dto.endDate === undefined ? undefined : BigInt(dto.endDate),
        daysOfWeek:
          dto.daysOfWeek === undefined ? undefined : daysToString(dto.daysOfWeek),
        updatedAt: now,
        updatedById: (dto as any).updatedById ?? undefined,
      },
    });
  }

  async toggleActive(id: string, active: boolean) {
    await this.ensure(id);
    return this.prisma.priceRule.update({
      where: { id },
      data: { active: b2i(active), updatedAt: BigInt(Date.now()) },
    });
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.priceRule.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async ensure(id: string) {
    const found = await this.prisma.priceRule.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Promotion not found');
  }
}
