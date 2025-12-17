import {
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Query,
  Req,
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
import { MarginSummaryDto } from './dto/margin-summary.dto';
import { MarginsQueryDto } from './dto/margins-query.dto';
import { MarginsResponseDto } from './dto/margins-response.dto';
import { ProfitService } from './services/profit.service';

@ApiTags('Manager Profit')
@ApiBearerAuth('JWT-auth')
@Controller('manager/profit')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('MANAGER')
export class ManagerProfitController {
  private readonly logger = new Logger(ManagerProfitController.name);

  constructor(private readonly profitService: ProfitService) {}

  @Get('margins')
  @ApiOperation({ summary: 'Get profit margins summary and product breakdown' })
  @ApiOkResponse({
    description: 'Profit margins fetched.',
    type: MarginsResponseDto as any,
  })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Requires MANAGER role.' })
  @ApiInternalServerErrorResponse({ description: 'Failed to calculate margins.' })
  async getMargins(
    @Query() dto: MarginsQueryDto,
    @Req() req: any,
  ): Promise<MarginsResponseDto> {
    try {
      const userId = this.resolveUserId(req?.user);
      return await this.profitService.getMargins(dto, userId);
    } catch (err: any) {
      this.logger.error('getMargins failed', err?.stack || err);
      throw new InternalServerErrorException('Failed to calculate margins');
    }
  }

  @Get('tiles/total-revenue')
  @ApiOperation({ summary: 'Get total revenue for profit tiles' })
  @ApiOkResponse({ description: 'Total revenue fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Requires MANAGER role.' })
  @ApiInternalServerErrorResponse({ description: 'Failed to calculate margins.' })
  async getTotalRevenue(@Query() dto: MarginsQueryDto) {
    const summary = await this.getSummary(dto);
    return { totalRevenue: summary.revenue };
  }

  @Get('tiles/total-cost')
  @ApiOperation({ summary: 'Get total cost for profit tiles' })
  @ApiOkResponse({ description: 'Total cost fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Requires MANAGER role.' })
  @ApiInternalServerErrorResponse({ description: 'Failed to calculate margins.' })
  async getTotalCost(@Query() dto: MarginsQueryDto) {
    const summary = await this.getSummary(dto);
    return { totalCost: summary.cost };
  }

  @Get('tiles/overall-margin')
  @ApiOperation({ summary: 'Get overall margin percentage for profit tiles' })
  @ApiOkResponse({ description: 'Overall margin fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Requires MANAGER role.' })
  @ApiInternalServerErrorResponse({ description: 'Failed to calculate margins.' })
  async getOverallMargin(@Query() dto: MarginsQueryDto) {
    const summary = await this.getSummary(dto);
    return { overallMargin: summary.marginPercent };
  }

  @Get('tiles/total-profit')
  @ApiOperation({ summary: 'Get total profit for profit tiles' })
  @ApiOkResponse({ description: 'Total profit fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Requires MANAGER role.' })
  @ApiInternalServerErrorResponse({ description: 'Failed to calculate margins.' })
  async getTotalProfit(@Query() dto: MarginsQueryDto) {
    const summary = await this.getSummary(dto);
    return { totalProfit: summary.profit };
  }

  @Get('tiles/items-sold')
  @ApiOperation({ summary: 'Get items sold for profit tiles' })
  @ApiOkResponse({ description: 'Items sold fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Requires MANAGER role.' })
  @ApiInternalServerErrorResponse({ description: 'Failed to calculate margins.' })
  async getItemsSold(@Query() dto: MarginsQueryDto) {
    const summary = await this.getSummary(dto);
    return { itemsSold: summary.itemsSold };
  }

  @Get('tiles/transactions')
  @ApiOperation({ summary: 'Get transactions count for profit tiles' })
  @ApiOkResponse({ description: 'Transactions fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Requires MANAGER role.' })
  @ApiInternalServerErrorResponse({ description: 'Failed to calculate margins.' })
  async getTransactions(@Query() dto: MarginsQueryDto) {
    const summary = await this.getSummary(dto);
    return { transactions: summary.transactions };
  }

  private resolveUserId(user: any): number | undefined {
    const candidate = user?.id ?? user?.userId ?? user?.sub;
    const numericId = Number(candidate ?? NaN);
    if (!Number.isInteger(numericId) || numericId <= 0) return undefined;
    return numericId;
  }

  private async getSummary(dto: MarginsQueryDto): Promise<MarginSummaryDto> {
    try {
      return await this.profitService.getSummary(dto);
    } catch (err: any) {
      this.logger.error('getSummary failed', err?.stack || err);
      throw new InternalServerErrorException('Failed to calculate margins');
    }
  }
}
