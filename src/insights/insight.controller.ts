// insight.controller.ts
import {
  Controller,
  Get,
  Logger,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { InsightService } from './insight.service';
import { InsightQueryDto } from './dto/insight-query.dto';
import { SalesHeaderDto } from './dto/sales-header.dto';
import { TopItemSummaryDto } from './dto/top-item-summary.dto';
import { ChartSeriesDto } from './dto/chart-series.dto';

@ApiTags('insight')
@Controller('insight')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class InsightController {
  private readonly logger = new Logger(InsightController.name);

  constructor(private readonly insightService: InsightService) {}

  // -------- HEADER --------
  @Get('header')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER','MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get KPI header (total sales, customers, products)' })
  @ApiOkResponse({ description: 'Header fetched', type: SalesHeaderDto })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiBadRequestResponse({ description: 'Bad query parameters.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async header(@Query() q: InsightQueryDto): Promise<SalesHeaderDto> {
    try {
      return await this.insightService.salesHeader(
        q.stockkeeperId,
        q.period,
        q.from,
        q.to,
      );
    } catch (err: any) {
      this.logger.error('header failed', err?.stack || err);
      if (err?.status && err?.response) throw err;
      throw new InternalServerErrorException('Failed to load header');
    }
  }

  // -------- TOP ITEMS --------
  @Get('top-items')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER','MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Top selling items for the period' })
  @ApiOkResponse({ description: 'Top items fetched', type: [TopItemSummaryDto] })
  async topItems(@Query() q: InsightQueryDto): Promise<TopItemSummaryDto[]> {
    try {
      return await this.insightService.topItems(
        q.stockkeeperId,
        q.period,
        q.from,
        q.to,
        q.limit ?? 10,
      );
    } catch (err: any) {
      this.logger.error('topItems failed', err?.stack || err);
      if (err?.status && err?.response) throw err;
      throw new InternalServerErrorException('Failed to load top items');
    }
  }

  // -------- SALES TREND (chart) --------
  @Get('sales-trend')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER','MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Daily sales totals for charting' })
  @ApiOkResponse({ description: 'Trend fetched', type: [ChartSeriesDto] })
  async salesTrend(@Query() q: InsightQueryDto): Promise<ChartSeriesDto[]> {
    try {
      return await this.insightService.salesTrend(
        q.stockkeeperId,
        q.period,
        q.from,
        q.to,
      );
    } catch (err: any) {
      this.logger.error('salesTrend failed', err?.stack || err);
      if (err?.status && err?.response) throw err;
      throw new InternalServerErrorException('Failed to load sales trend');
    }
  }
}
