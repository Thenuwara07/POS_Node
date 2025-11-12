// src/manager/services/manager-accounts.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserCredentialsDto } from '../dto/user-management.dto';
import { UpdateCustomerNameDto } from '../dto/update-customer-name.dto';
import * as bcrypt from 'bcryptjs';
import { Role } from '../../../generated/prisma-client';

@Injectable()
export class ManagerAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Admin/Manager can change another user's name and/or password.
   * - Writes bcrypt hash into `password`
   * - Stores algo & salt in columns you already have
   * - Updates audit column `updated_by`
   */
  async updateUserCredentials(
    actingUser: { id: number; role: Role },
    dto: UpdateUserCredentialsDto,
  ) {
    // RBAC: Only ADMIN or MANAGER
    const adminOrManager = new Set<Role>([Role.ADMIN, Role.MANAGER]);
    if (!adminOrManager.has(actingUser.role)) {
      throw new ForbiddenException('Only ADMIN or MANAGER can perform this action.');
    }

    if (!dto.newName && !dto.newPassword) {
      throw new BadRequestException('Provide at least one of newName or newPassword.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found.');

    const data: any = {
      updatedById: actingUser.id,
    };

    if (dto.newName) data.name = dto.newName;

    if (dto.newPassword) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(dto.newPassword, salt);
      data.password = hash;
      data.passwordAlgo = 'bcrypt';
      data.passwordSalt = salt; // optional (bcrypt embeds the salt in the hash, but you have a column for it)
    }

    const updated = await this.prisma.user.update({
      where: { id: dto.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        contact: true,
        role: true,
        colorCode: true,
        updatedAt: true,
        updatedById: true,
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            contact: true,
            role: true,
          },
        },
      },
    });

    return {
      message: 'User credentials updated successfully.',
      user: updated,
    };
  }

  /**
   * Optional helper since "customers" exist separately from "users":
   * Lets Admin/Manager rename a Customer record.
   */
  async updateCustomerName(
    actingUser: { id: number; role: Role },
    dto: UpdateCustomerNameDto,
  ) {
    const adminOrManager = new Set<Role>([Role.ADMIN, Role.MANAGER]);
    if (!adminOrManager.has(actingUser.role)) {
      throw new ForbiddenException('Only ADMIN or MANAGER can perform this action.');
    }


    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found.');

    const updated = await this.prisma.customer.update({
      where: { id: dto.customerId },
      data: { name: dto.newName },
      select: {
        id: true,
        name: true,
        contact: true,
      },
    });

    return {
      message: 'Customer name updated successfully.',
      customer: updated,
    };
  }
}
