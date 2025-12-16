import { Controller, Get, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PerformanceSummaryService } from './performance-summary.service';
import { PerformancePeriod } from './dto/performance-period.enum';
import { PerformanceQueryDto } from './dto/performance-query.dto';
import { PerformanceSummaryDto } from './dto/performance-summary.dto';

@ApiTags('Performance Summary')
@Controller('performance-summary')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class PerformanceSummaryController {
  constructor(
    private readonly performanceSummaryService: PerformanceSummaryService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Performance summary (sales + transactions) for today/week/month',
  })
  @ApiOkResponse({
    description: 'Performance summary fetched',
    type: PerformanceSummaryDto,
  })
  async getSummary(@Query() query: PerformanceQueryDto): Promise<PerformanceSummaryDto> {
    const period = query.period ?? PerformancePeriod.TODAY;
    return this.performanceSummaryService.getSummary(period);
  }
}
