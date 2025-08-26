import { Controller, Get, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { InsightService } from './insight.service';
import { TotalProductsDto, TotalSalesDto, TotalCustomersDto } from './dto/insight.dto';  // Make sure DTOs are in the right path


import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthGuard } from '@nestjs/passport';



import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('insight')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)    
@Roles('StockKeeper')
@Controller('insight')
export class InsightController {
  constructor(private readonly insightService: InsightService) {}

  @Get('total-products')
  async getTotalProducts(): Promise<TotalProductsDto> {
    try {
      const count = await this.insightService.getTotalProducts();
      return { totalProducts: count };
    } catch (error) {
      throw new HttpException('Failed to fetch total products', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('total-sales')
  async getTotalSales(): Promise<TotalSalesDto> {
    try {
      const count = await this.insightService.getTotalSales();
      return { totalSales: count };
    } catch (error) {
      throw new HttpException('Failed to fetch total sales', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('total-customers')
  async getTotalCustomers(): Promise<TotalCustomersDto> {
    try {
      const count = await this.insightService.getTotalCustomers();
      return { totalCustomers: count };
    } catch (error) {
      throw new HttpException('Failed to fetch total customers', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
