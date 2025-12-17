import {
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FinanceService } from './services/finance.service';

@ApiTags('Manager Finance')
@ApiBearerAuth('JWT-auth')
@Controller('manager/finance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('MANAGER')
export class ManagerFinanceController {
  private readonly logger = new Logger(ManagerFinanceController.name);

  constructor(private readonly financeService: FinanceService) {}

  @Get('total-cash-sales')
  @ApiOperation({ summary: 'Get total cash sales for a date range' })
  @ApiOkResponse({ description: 'Total cash sales fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Requires MANAGER role.' })
  @ApiInternalServerErrorResponse({ description: 'Failed to fetch cash sales.' })
  async getTotalCashSales() {
    try {
      const totalCashSales = await this.financeService.getTotalCashSales();
      return { totalCashSales };
    } catch (err: any) {
      this.logger.error('getTotalCashSales failed', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch cash sales');
    }
  }

  @Get('total-card-sales')
  @ApiOperation({ summary: 'Get total card sales for a date range' })
  @ApiOkResponse({ description: 'Total card sales fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Requires MANAGER role.' })
  @ApiInternalServerErrorResponse({ description: 'Failed to fetch card sales.' })
  async getTotalCardSales() {
    try {
      const totalCardSales = await this.financeService.getTotalCardSales();
      return { totalCardSales };
    } catch (err: any) {
      this.logger.error('getTotalCardSales failed', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch card sales');
    }
  }
}
