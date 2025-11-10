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
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ManagerService } from './manager.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';

// NEW: import DTOs and service for creditors
import { CreateCreditorDto } from './dto/create-creditor.dto';
import { UpdateCreditorDto } from './dto/update-creditor.dto';
import { CreditorService } from './services/creditor.service';

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

  constructor(
    private readonly managerService: ManagerService,
    // NEW: inject creditor service
    private readonly creditorService: CreditorService,
  ) {}

  // --- CREATE MANAGER ---
  @Post('add-user')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new user' })
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
  @Get('get-users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users' })
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
  @Roles('MANAGER')
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

  // ----------------------------------------------------------------
  // ------------------------ CREDITORS CRUD -------------------------
  // ----------------------------------------------------------------

  // CREATE
  @Post('creditors')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a creditor record' })
  @ApiCreatedResponse({ description: 'Creditor created.' })
  @ApiBadRequestResponse({ description: 'Invalid input.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerContact: { type: 'string', example: '+94771234567' },
        totalDue: { type: 'number', example: 1250.0 },
        notes: { type: 'string', example: 'Carry over from invoice INV-2025-0012' },
      },
      required: ['customerContact', 'totalDue'],
    },
  })
  async createCreditor(@Body() dto: CreateCreditorDto) {
    try {
      // If you keep userId in JWT, extract and pass it
      return await this.creditorService.create(dto /*, userIdFromJwt */);
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to create creditor', err?.stack || err);
      throw new InternalServerErrorException('Failed to create creditor');
    }
  }

  // LIST
  @Get('creditors')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List creditors' })
  @ApiOkResponse({ description: 'Creditor list fetched.' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async listCreditors(
    @Query('search') search?: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    try {
      return await this.creditorService.findAll(search, Number(limit), Number(offset));
    } catch (err: any) {
      this.logger.error('Failed to fetch creditors', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch creditors');
    }
  }

  // GET ONE
  @Get('creditors/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get creditor by ID' })
  async getCreditor(@Param('id') id: string) {
    try {
      return await this.creditorService.findOne(Number(id));
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to fetch creditor', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch creditor');
    }
  }

  // UPDATE
  @Patch('creditors/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update creditor by ID' })
  @ApiOkResponse({ description: 'Creditor updated.' })
  async updateCreditor(@Param('id') id: string, @Body() dto: UpdateCreditorDto) {
    try {
      return await this.creditorService.update(Number(id), dto /*, userIdFromJwt */);
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to update creditor', err?.stack || err);
      throw new InternalServerErrorException('Failed to update creditor');
    }
  }

  // DELETE
  @Delete('creditors/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN') // keep delete stricter if you want
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete creditor by ID' })
  @ApiOkResponse({ description: 'Creditor deleted.' })
  async deleteCreditor(@Param('id') id: string) {
    try {
      return await this.creditorService.remove(Number(id));
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to delete creditor', err?.stack || err);
      throw new InternalServerErrorException('Failed to delete creditor');
    }
  }
}
