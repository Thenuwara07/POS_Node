import { ApiProperty } from '@nestjs/swagger';

export class BatchDto {
  @ApiProperty({ example: 'BATCH001' })
  batchID!: string;

  @ApiProperty({ example: 80.0, description: 'purchase price' })
  pprice!: number;

  @ApiProperty({ example: 120.0, description: 'sell price' })
  price!: number;

  @ApiProperty({ example: 50 })
  quantity!: number;

  @ApiProperty({ example: 10.0 })
  discountAmount!: number;
}
