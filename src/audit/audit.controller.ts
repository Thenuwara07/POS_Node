import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AuditService } from './services/audit.service';
import { CreateAuthLogDto } from './dto/create-auth-log.dto';
import { QueryAuthLogDto } from './dto/query-auth-log.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Audit • Auth Logs')
@ApiBearerAuth('JWT-auth')
@Controller('audit/logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  /**
   * Record a login/logout event.
   * Typically called inside your AuthController after successful login/logout.
   */
  @Post()
  @UseGuards(AuthGuard('jwt')) // require JWT; if you need to log pre-JWT events, remove/adjust
  @ApiOperation({ summary: 'Create an auth log (LOGIN/LOGOUT)' })
  @ApiOkResponse({ description: 'Log created.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  async create(@Body() dto: CreateAuthLogDto, @Req() req: any) {
    return this.audit.logAuth(dto, req);
  }

  /**
   * List logs (ADMIN/MANAGER).
   * Query: userId, action, fromTs, toTs, page, pageSize
   */
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'List auth logs (ADMIN/MANAGER)' })
  @ApiOkResponse({ description: 'Logs fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN/MANAGER.' })
  async list(@Query() q: QueryAuthLogDto) {
    return this.audit.listAuth(q);
  }

  /**
   * List only the current user's logs.
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List my auth logs' })
  async myLogs(@Req() req: any, @Query() q: Omit<QueryAuthLogDto, 'userId'>) {
    return this.audit.listMyAuth(Number(req.user.id), q);
  }
}
