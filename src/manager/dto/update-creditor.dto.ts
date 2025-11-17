import { PartialType } from '@nestjs/swagger';
import { CreateCreditorDto } from './create-creditor.dto';
import { IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class UpdateCreditorDto extends PartialType(CreateCreditorDto) {
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalDue?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  // If you ever want to allow moving to another customer:
  @IsString()
  @IsOptional()
  customerContact?: string;
}
