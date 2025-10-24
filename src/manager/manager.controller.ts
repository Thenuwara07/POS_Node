import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Post('add-manager')
  create(@Body() dto: CreateManagerDto) {
    return this.managerService.create(dto);
  }

  @Get('get-managers')
  findAll(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.managerService.findAll(search, role, limit, offset);
  }

  @Get('get-manager/:id')
  findOne(@Param('id') id: string) {
    return this.managerService.findOne(Number(id));
  }

  @Patch('update-manager/:id')
  update(@Param('id') id: string, @Body() dto: UpdateManagerDto) {
    return this.managerService.update(Number(id), dto);
  }

  @Delete('delete-manager/:id')
  remove(@Param('id') id: string) {
    return this.managerService.remove(Number(id));
  }
}
