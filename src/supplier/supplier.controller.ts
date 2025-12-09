import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
  Delete,
  ParseIntPipe,
  Param,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { Request } from 'express';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierService } from './supplier.service';

@ApiTags('supplier')
@Controller('supplier')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class SupplierController {
  private readonly logger = new Logger(SupplierController.name);

  constructor(private readonly supplierService: SupplierService) {}





  // ---------------------------------------------------------------------------------------------------------

  

  // Add Supplier 
  @Post('suppliers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER', 'MANAGER') // Allow managers to create too (keeps parity with update/delete)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string'},
        brand: { type: 'string'},
        contact: { type: 'string'},
        email: { type: 'string'},
        address: { type: 'string' },
        location: { type: 'string'},
        notes: { type: 'string'},
        colorCode: { type: 'string'},
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'PENDING'] },
        preferred: { type: 'boolean' },
        active: { type: 'boolean' },
      },
      required: ['name', 'brand', 'contact'],
    },
  })
  @ApiCreatedResponse({ description: 'Supplier created.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad input.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  async createSupplier(@Body() dto: CreateSupplierDto, @Req() req: Request) {
    try {
      const userId =
        (req?.user as any)?.userId ||
        (req?.user as any)?.sub ||
        undefined;

      return await this.supplierService.createSupplier(dto, userId);
    } catch (err: any) {
      if (err?.status && err?.response) throw err;
      this.logger.error('Failed to create supplier', err?.stack || err);
      throw new InternalServerErrorException('Failed to create supplier');
    }
  }




// --------------------------------------------------------------------------------------------

            // Get all suppliers

  @Get('suppliers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List suppliers' })
  @ApiOkResponse({ description: 'Suppliers fetched.' })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
  async listSuppliers() {
    return this.supplierService.listSuppliers();
  }




  // --------------------------------------------------------------------------------------------------

      // Get supplier by ID

  @Get('suppliers/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get supplier by id' })
  @ApiOkResponse({ description: 'Supplier fetched.' })
  async getSupplierById(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.getSupplierById(id);
  }



  // --------------------------------------------------------------------------------------------

      // Update Supplier

  @Patch('suppliers/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update supplier (optional)' })
  @ApiOkResponse({ description: 'Supplier updated.' })
  async updateSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierDto,
    @Req() req: Request,
  ) {
    const userId =
      (req?.user as any)?.userId ||
      (req?.user as any)?.sub ||
      undefined;
    return this.supplierService.updateSupplier(id, dto, userId);
  }


  // ---------------------------------------------------------------------------------

    //  Delete Supplier 
    

  @Delete('suppliers/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STOCKKEEPER', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete supplier (optional)' })
  @ApiOkResponse({ description: 'Supplier deleted.' })
  async deleteSupplier(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.deleteSupplier(id);
  }


}
