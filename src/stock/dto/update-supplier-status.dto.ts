import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { SupplierStatus } from '../../../generated/prisma-client';

export class UpdateSupplierStatusDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  supplierId!: number;

  @ApiProperty({ enum: SupplierStatus, example: SupplierStatus.ACTIVE })
  @IsEnum(SupplierStatus)
  status!: SupplierStatus;
}
