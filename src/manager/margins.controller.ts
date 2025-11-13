import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  InternalServerErrorException,
  Logger,
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

import { Roles } from '../auth/roles.decorator';     // adjust path if needed
import { RolesGuard } from '../auth/roles.guard';     // adjust path if needed

import { MarginsService } from './services/margins.service';
import { MarginsQueryDto } from './dto/margins-query.dto';
import { MarginsResponseDto } from './dto/margins-response.dto';

@ApiTags('Manager • Margins')
@ApiBearerAuth('JWT-auth')
@Controller('manager/margins')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('MANAGER') // <-- manager-only (no ADMIN)
export class ManagerMarginsController {
  private readonly logger = new Logger(ManagerMarginsController.name);

  constructor(private readonly service: MarginsService) {}

  /**
   * GET /manager/margins?fromTs=&toTs=&q=&skip=&take=
   * Returns summary cards + per-product breakdown for the period.
   */
  @Get()
  @ApiOperation({ summary: 'Get profit & margin analytics (manager only)' })
  @ApiOkResponse({ description: 'Margins calculated.', type: MarginsResponseDto as any })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Requires MANAGER role.' })
  @ApiInternalServerErrorResponse({ description: 'Failed to calculate margins.' })
  async getMargins(@Query() dto: MarginsQueryDto, @Req() req): Promise<MarginsResponseDto> {
    try {
      const userId: number | undefined = req.user?.id;
      return await this.service.getMargins(dto, userId);
    } catch (err: any) {
      this.logger.error('getMargins failed', err?.stack || err);
      throw new InternalServerErrorException('Failed to calculate margins');
    }
  }
}
