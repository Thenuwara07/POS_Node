// src/manager/dto/update-manager.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateManagerDto } from './create-manager.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateManagerDto extends PartialType(CreateManagerDto) {
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
