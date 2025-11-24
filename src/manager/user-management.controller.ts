// src/manager/controllers/manager-accounts.controller.ts
import { AuthGuard } from '@nestjs/passport';
import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ManagerAccountsService } from './services/manager-accounts.service';
import { UpdateUserCredentialsDto } from './dto/user-management.dto';
import { UpdateCustomerNameDto } from './dto/update-customer-name.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../../generated/prisma-client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('ManagerAccounts')
@ApiBearerAuth('JWT-auth')
@Controller('manager/accounts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ManagerAccountsController {
  constructor(private readonly service: ManagerAccountsService) {}

  /**
   * Change a user's name and/or password
   * Allowed Roles: ADMIN, MANAGER
   *
   * PATCH /manager/accounts/user/credentials
   * body: { userId, newName?, newPassword? }
   */
  @Patch('user/credentials')
  @ApiOperation({ summary: 'Update user login credentials' })
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateUserCredentials(
    @CurrentUser() actingUser: { id: number; role: Role },
    @Body() dto: UpdateUserCredentialsDto,
  ) {
    return this.service.updateUserCredentials(actingUser, dto);
  }

  /**
   * Rename a Customer (note: Customer table has no password)
   *
   * PATCH /manager/accounts/customer/name
   * body: { customerId, newName }
   */
  @Patch('customer/name')
  @ApiOperation({ summary: 'Rename a customer record' })
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateCustomerName(
    @CurrentUser() actingUser: { id: number; role: Role },
    @Body() dto: UpdateCustomerNameDto,
  ) {
    return this.service.updateCustomerName(actingUser, dto);
  }
}
