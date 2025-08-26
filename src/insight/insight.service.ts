import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InsightService {
  constructor(private prisma: PrismaService) {}

  async getTotalProducts(): Promise<number> {
    try {
      return await this.prisma.item.count();
    } catch (error) {
      throw new Error('Error fetching total products');
    }
  }

  async getTotalSales(): Promise<number> {
    try {
      return await this.prisma.sale.count();
    } catch (error) {
      throw new Error('Error fetching total sales');
    }
  }

  async getTotalCustomers(): Promise<number> {
    try {
      return await this.prisma.customer.count();
    } catch (error) {
      throw new Error('Error fetching total customers');
    }
  }
}
