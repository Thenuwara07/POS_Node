import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma-client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCreditorDto } from '../dto/create-creditor.dto';
import { UpdateCreditorDto } from '../dto/update-creditor.dto';

function normalizeContact(raw: string) {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return raw.trim();
  if (digits.startsWith('0')) return '+94' + digits.slice(1);
  if (digits.startsWith('94')) return '+' + digits;
  if (raw.startsWith('+')) return raw.trim();
  return '+' + digits;
}

@Injectable()
export class CreditorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCreditorDto, actorUserId?: number) {
    const contact = normalizeContact(dto.customerContact);

    // Ensure a Customer exists (auto-create if not)
    await this.prisma.customer.upsert({
      where: { contact },
      update: {}, // nothing to update
      create: {
        contact,
        name: contact, // or set a better default like "Walk-in Customer"
      },
    });

    return this.prisma.creditor.create({
      data: {
        customerContact: contact,         // FK to Customer.contact
        totalDue: dto.totalDue,
        notes: dto.notes,
        createdById: actorUserId,
      },
    });
  }

  async findAll(search?: string, limit = 20, offset = 0) {
    const where: Prisma.CreditorWhereInput | undefined =
      search && search.trim()
        ? {
            OR: [
              { customerContact: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined;

    const [rows, count] = await this.prisma.$transaction([
      this.prisma.creditor.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          customer: { select: { name: true, contact: true } },
        },
      }),
      this.prisma.creditor.count({ where }),
    ]);

    return { count, rows };
  }

  async findOne(id: number) {
    const row = await this.prisma.creditor.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true, contact: true } },
      },
    });
    if (!row) throw new NotFoundException('Creditor not found');
    return row;
  }

  async update(id: number, dto: UpdateCreditorDto, actorUserId?: number) {
    let contact: string | undefined = undefined;

    if (dto.customerContact) {
      contact = normalizeContact(dto.customerContact);

      // Ensure (or create) the target customer exists
      await this.prisma.customer.upsert({
        where: { contact },
        update: {},
        create: { contact, name: contact },
      });
    }

    try {
      return await this.prisma.creditor.update({
        where: { id },
        data: {
          customerContact: contact,
          totalDue: dto.totalDue,
          notes: dto.notes,
          updatedById: actorUserId,
        },
      });
    } catch (e) {
      const found = await this.prisma.creditor.findUnique({ where: { id } });
      if (!found) throw new NotFoundException('Creditor not found');
      throw e;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.creditor.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Creditor not found');
    }
  }
}
