import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditorDto } from './dto/create-creditor.dto';
import { UpdateCreditorDto } from '../creditors/dto/update-creditor.dto';

@Injectable()
export class CreditorsService {
  constructor(private readonly prisma: PrismaService) {}

  /** POST /creditors/add-creditor */
  async create(dto: CreateCreditorDto) {
    const data = {
      name: String(dto.name).trim(),
      phone: normalizePhone(dto.phone),
    };

    try {
      return await this.prisma.creditor.create({ data });
    } catch (e: any) {
      if (isUniqueConstraint(e, 'phone')) {
        throw new ConflictException('A creditor with this phone already exists');
      }
      throw e;
    }
  }

  /** GET /creditors/get-creditors */
  async findAll() {
    return this.prisma.creditor.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /** GET /creditors/get-creditor/:id */
  async findOne(id: number) {
    const c = await this.prisma.creditor.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Creditor not found');
    return c;
    }

  /** PATCH /creditors/update-creditor/:id */
  async update(id: number, dto: UpdateCreditorDto) {
    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = String(dto.name).trim();
    if (dto.phone !== undefined) data.phone = normalizePhone(dto.phone);

    try {
      return await this.prisma.creditor.update({
        where: { id },
        data,
      });
    } catch (e: any) {
      if (isUniqueConstraint(e, 'phone')) {
        throw new ConflictException('A creditor with this phone already exists');
      }
      if (isNotFound(e)) {
        throw new NotFoundException('Creditor not found');
      }
      throw e;
    }
  }
}

/* ---------- helpers ---------- */
function normalizePhone(p: string) {
  return String(p).replace(/\s+/g, '').trim();
}

function isUniqueConstraint(err: unknown, field: string) {
  if (err && typeof err === 'object' && 'code' in err && (err as any).code === 'P2002') {
    const target = (err as any).meta?.target;
    if (Array.isArray(target)) return target.includes(field);
    if (typeof target === 'string') return target.includes(field);
  }
  return false;
}

function isNotFound(err: unknown) {
  return err && typeof err === 'object' && 'code' in err && (err as any).code === 'P2025';
}
