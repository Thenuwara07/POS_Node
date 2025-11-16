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
import { ProfitMarginReportQueryDto } from './dto/profit-margin-report.dto';

// 🔹 Swagger imports
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('Manager Reports')
@ApiBearerAuth('JWT-auth') // 👈 must match the name in addBearerAuth()
@Controller('manager/reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.MANAGER)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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
}
