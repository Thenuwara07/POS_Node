import { ApiProperty } from '@nestjs/swagger';
import { SupplierStatus } from '../../../generated/prisma-client';

export class SupplierStatusDto {
  @ApiProperty({ example: 3, description: 'Supplier primary key' })
  supplierId!: number;

  @ApiProperty({ example: 'Acme Traders', description: 'Supplier display name' })
  supplierName!: string;

  @ApiProperty({
    enum: SupplierStatus,
    example: SupplierStatus.ACTIVE,
    description: 'Current enum status of the supplier',
  })
  status!: SupplierStatus;

  @ApiProperty({
    format: 'date-time',
    description: 'Timestamp when this record was last updated',
  })
  updatedAt!: Date;
}
