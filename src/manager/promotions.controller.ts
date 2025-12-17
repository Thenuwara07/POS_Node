import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';   // adjust path to your auth folder
import { RolesGuard } from '../auth/roles.guard';   // adjust path
import { PromotionService } from './services/promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@ApiTags('Promotions')
@ApiBearerAuth('JWT-auth')
@Controller('manager/promotions')
export class PromotionsController {
  private readonly logger = new Logger(PromotionsController.name);

  constructor(private readonly service: PromotionService) {}

  private parseId(id: string): number {
    const numeric = Number(id);
    if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
      throw new BadRequestException('Promotion ID must be an integer');
    }
    return numeric;
  }

  // --- Create ---
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Create a promotion' })
  @ApiOkResponse({ description: 'Promotion created.' })
  async create(@Body() dto: CreatePromotionDto) {
    try {
      return await this.service.create(dto);
    } catch (err: any) {
      this.logger.error('Create promotion failed', err?.stack || err);
      throw new InternalServerErrorException('Failed to create promotion');
    }
  }

  // --- List ---
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'List promotions' })
  @ApiOkResponse({ description: 'Promotions fetched.' })
  async list() {
    try {
      return await this.service.findAll();
    } catch (err: any) {
      this.logger.error('List promotions failed', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch promotions');
    }
  }

  // --- Get One ---
  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get a promotion by ID' })
  async getOne(@Param('id') id: string) {
    return this.service.findOne(this.parseId(id));
  }

  // --- Update ---
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Update a promotion' })
  async update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    try {
      return await this.service.update(this.parseId(id), dto);
    } catch (err: any) {
      this.logger.error('Update promotion failed', err?.stack || err);
      throw new InternalServerErrorException('Failed to update promotion');
    }
  }

  // --- Toggle Active ---
  @Patch(':id/active')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Toggle promotion active flag' })
  async toggleActive(@Param('id') id: string, @Body('active') active: boolean) {
    try {
      return await this.service.toggleActive(this.parseId(id), active);
    } catch (err: any) {
      this.logger.error('Toggle promotion failed', err?.stack || err);
      throw new InternalServerErrorException('Failed to toggle promotion');
    }
  }

  // --- Delete ---
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Delete promotion by ID' })
  @ApiOkResponse({ description: 'Promotion deleted.' })
  async remove(@Param('id') id: string) {
    try {
      return await this.service.remove(this.parseId(id));
    } catch (err: any) {
      this.logger.error('Delete promotion failed', err?.stack || err);
      throw new InternalServerErrorException('Failed to delete promotion');
    }
  }
}
