import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class RestockDto {
  @ApiProperty()
  itemId!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  categoryName!: string;

  @ApiProperty()
  createdBy!: string | null;

  @ApiProperty()
  qty!: number;

  @ApiProperty()
  unitPrice!: number;

  @ApiProperty()
  sellPrice!: number;

  @ApiProperty()
  status!: number;

  @ApiProperty()
  batchId!:string | null;

  @ApiProperty()
  @IsInt()
  supplierId!: number;
}
