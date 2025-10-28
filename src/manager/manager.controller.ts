import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  UseGuards,
  InternalServerErrorException,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ManagerService } from './manager.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';

@ApiTags('Manager')
@Controller('manager')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class ManagerController {
  private readonly logger = new Logger(ManagerController.name);

  constructor(private readonly managerService: ManagerService) {}

  // --- CREATE MANAGER ---
  @Post('add-manager')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new manager' })
  @ApiCreatedResponse({ description: 'Manager created.' })
  @ApiBadRequestResponse({ description: 'Invalid input or duplicate email.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async create(@Body() dto: CreateManagerDto) {
    try {
      return await this.managerService.create(dto);
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to create manager', err?.stack || err);
      throw new InternalServerErrorException('Failed to create manager');
    }
  }

  // --- GET ALL MANAGERS ---
  @Get('get-managers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles( 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all managers' })
  @ApiOkResponse({ description: 'Managers fetched.' })
  async findAll(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    try {
      return await this.managerService.findAll(search, role, limit, offset);
    } catch (err: any) {
      this.logger.error('Failed to fetch managers', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch managers');
    }
  }

  // --- GET ONE MANAGER ---
  @Get('get-manager/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a single manager by ID' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.managerService.findOne(Number(id));
    } catch (err: any) {
      this.logger.error('Failed to fetch manager', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch manager');
    }
  }

  // --- UPDATE MANAGER ---
  @Patch('update-manager/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update manager details' })
  async update(@Param('id') id: string, @Body() dto: UpdateManagerDto) {
    try {
      return await this.managerService.update(Number(id), dto);
    } catch (err: any) {
      this.logger.error('Failed to update manager', err?.stack || err);
      throw new InternalServerErrorException('Failed to update manager');
    }
  }

  // --- DELETE MANAGER ---
  @Delete('delete-manager/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete manager by ID' })
  async remove(@Param('id') id: string) {
    try {
      return await this.managerService.remove(Number(id));
    } catch (err: any) {
      this.logger.error('Failed to delete manager', err?.stack || err);
      throw new InternalServerErrorException('Failed to delete manager');
    }
  }

  // --- TRENDING ITEMS ---
  @Get('trending-items')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get trending items based on report audit' })
  async getTrendingItems(
    @Query('limit') limit: number = 5,
    @Query('days') days: number = 7,
  ) {
    try {
      return await this.managerService.getTrendingItems(limit, days);
    } catch (err: any) {
      this.logger.error('Failed to fetch trending items', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch trending items');
    }
  }

  // --- AUDIT LOGS ---
  @Get('audit-logs')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles( 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'View audit logs' })
  async getAuditLogs(
    @Query('userId') userId?: number,
    @Query('reportCode') reportCode?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    try {
      return await this.managerService.getAuditLogs(userId, reportCode, limit, offset);
    } catch (err: any) {
      this.logger.error('Failed to fetch audit logs', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch audit logs');
    }
  }
}
