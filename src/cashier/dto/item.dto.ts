import { ApiProperty } from '@nestjs/swagger';
import { BatchDto } from './batch.dto';

export class ItemDto {
  @ApiProperty() id!: number;
  @ApiProperty({ nullable: true }) itemcode!: string | null;
  @ApiProperty() name!: string;
  @ApiProperty() colorCode!: string;
  @ApiProperty({ type: BatchDto, isArray: true }) batches!: BatchDto[];
}
