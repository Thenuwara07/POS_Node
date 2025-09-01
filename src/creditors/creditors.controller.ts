import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreditorsService } from './creditors.service';
import { CreateCreditorDto } from './dto/create-creditor.dto';
import { UpdateCreditorDto } from '../creditors/dto/update-creditor.dto';

@Controller('creditors') // base: /creditors
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class CreditorsController {
  constructor(private readonly creditorsService: CreditorsService) {}

  // POST /creditors/add-creditor
  @Post('add-creditor')
  create(@Body() dto: CreateCreditorDto) {
    return this.creditorsService.create(dto);
  }

  // GET /creditors/get-creditors
  @Get('get-creditors')
  findAll() {
    return this.creditorsService.findAll();
  }

  // GET /creditors/get-creditor/:id
  @Get('get-creditor/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.creditorsService.findOne(id);
  }

  // PATCH /creditors/update-creditor/:id
  @Patch('update-creditor/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCreditorDto,
  ) {
    return this.creditorsService.update(id, dto);
  }
}
