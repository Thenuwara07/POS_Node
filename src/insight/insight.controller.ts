import { Controller, Get, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { InsightService } from './insight.service';
import { TotalProductsDto, TotalSalesDto, TotalCustomersDto } from './dto/insight.dto';
import { NetProfitDto } from './dto/netprofit.dto';
import { TopSellingItemDto } from './dto/top-selling-items.dto'

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthGuard } from '@nestjs/passport';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

// @ApiTags('insight')
// @ApiBearerAuth('JWT-auth')
// @UseGuards(AuthGuard('jwt'), RolesGuard)
// @Roles('StockKeeper') // Adjust the roles as necessary
@Controller('insight')
export class InsightController {
  constructor(private readonly insightService: InsightService) {}

  @Get('total-products')
  @ApiOperation({ summary: 'Get total number of products' })
  @ApiResponse({ status: 200, description: 'Returns total number of products', type: TotalProductsDto })
  async getTotalProducts(): Promise<TotalProductsDto> {
    try {
      const count = await this.insightService.getTotalProducts();
      return { totalProducts: count };
    } catch (error) {
      throw new HttpException('Failed to fetch total products', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('total-sales')
  @ApiOperation({ summary: 'Get total sales' })
  @ApiResponse({ status: 200, description: 'Returns total sales', type: TotalSalesDto })
  async getTotalSales(): Promise<TotalSalesDto> {
    try {
      const count = await this.insightService.getTotalSales();
      return { totalSales: count };
    } catch (error) {
      throw new HttpException('Failed to fetch total sales', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('total-customers')
  @ApiOperation({ summary: 'Get total number of customers' })
  @ApiResponse({ status: 200, description: 'Returns total number of customers', type: TotalCustomersDto })
  async getTotalCustomers(): Promise<TotalCustomersDto> {
    try {
      const count = await this.insightService.getTotalCustomers();
      return { totalCustomers: count };
    } catch (error) {
      throw new HttpException('Failed to fetch total customers', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('net-profit')
  @ApiOperation({ summary: 'Get net profit for the current month' })
  @ApiResponse({ status: 200, description: 'Returns net profit for the current month', type: NetProfitDto })
  async getNetProfit(): Promise<NetProfitDto> {
    try {
      const profit = await this.insightService.getNetProfitForCurrentMonth();
      return {
        totalSales: profit.totalSales,
        totalCosts: profit.totalCosts,
        netProfit: profit.netProfit,
        month: profit.month,
      };
    } catch (error) {
      throw new HttpException('Failed to fetch net profit', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('top-selling-items')
  @ApiOperation({ summary: 'Get top 5 selling items' })
  @ApiResponse({ status: 200, description: 'Returns top 5 selling items', type: [TopSellingItemDto] })
  async getTopSellingItems(): Promise<TopSellingItemDto[]> {
    try {
      return await this.insightService.getTopSellingItems();
    } catch (error) {
      throw new HttpException('Failed to fetch top selling items', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}