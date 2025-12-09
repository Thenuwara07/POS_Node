import { ApiProperty } from '@nestjs/swagger';

export class BatchDto {
  @ApiProperty() batchID!: string;
  @ApiProperty() pprice!: number;
  @ApiProperty() price!: number;
  @ApiProperty() quantity!: number;
  @ApiProperty() discountAmount!: number;
}
