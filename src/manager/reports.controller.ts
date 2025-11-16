import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../../generated/prisma-client';

import { ReportsService } from './services/reports.service';
import { CreditSalesService } from './services/credit-sales.service';

import { ProfitMarginReportQueryDto } from './dto/profit-margin-report.dto';
import { CreditSalesReportQueryDto } from './dto/credit-sales-report.dto';

import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('Manager Reports')
@ApiBearerAuth('JWT-auth')
@Controller('manager/reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.MANAGER)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly creditSalesService: CreditSalesService,
  ) {}

  @Get('profit-margin')
  @ApiOperation({ summary: 'Get profit & margin per invoice for a date range' })
  @ApiOkResponse({ description: 'Successfully returned profit & margin list' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized (no / invalid token)' })
  @ApiForbiddenResponse({ description: 'Forbidden (role is not MANAGER)' })
  async getProfitMargin(
    @Query() query: ProfitMarginReportQueryDto,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    const userId: number | undefined = user?.id ?? user?.sub;

    const data = await this.reportsService.getProfitMarginReport(query, userId);
    return { data };
  }

  @Get('credit-sales')
  @ApiOperation({ summary: 'Get credit sales for a date range' })
  @ApiOkResponse({ description: 'Successfully returned credit sales list' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized (no / invalid token)' })
  @ApiForbiddenResponse({ description: 'Forbidden (role is not MANAGER)' })
  async getCreditSales(
    @Query() query: CreditSalesReportQueryDto,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    const userId: number | undefined = user?.id ?? user?.sub;

    const data = await this.creditSalesService.getCreditSalesReport(
      query,
      userId,
    );
    return { data };
  }
}
