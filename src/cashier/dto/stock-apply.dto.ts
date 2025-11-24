import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockApplyUpdatedDto {
  @ApiProperty() batch_id!: string;
  @ApiProperty() item_id!: number;
  @ApiProperty() deducted!: number;
  @ApiPropertyOptional() note?: string;
}

export class StockApplyWarnDto {
  @ApiProperty() batch_id!: string;
  @ApiProperty() item_id!: number;
  @ApiProperty() requested!: number;
  @ApiPropertyOptional() available?: number | null;
  @ApiProperty({ enum: ['invalid_input', 'insufficient_stock'] }) reason!: 'invalid_input' | 'insufficient_stock';
}

export class StockApplyMissingDto {
  @ApiProperty() batch_id!: string;
  @ApiProperty() item_id!: number;
  @ApiProperty() requested!: number;
  @ApiProperty({ enum: ['not_found'] }) reason!: 'not_found';
}

export class StockApplyResultDto {
  @ApiProperty({ type: StockApplyUpdatedDto, isArray: true }) updated!: StockApplyUpdatedDto[];
  @ApiProperty({ type: StockApplyWarnDto, isArray: true }) warnings!: StockApplyWarnDto[];
  @ApiProperty({ type: StockApplyMissingDto, isArray: true }) missing!: StockApplyMissingDto[];
  // convenience getter in TS not serialized; omit here
}

export class UpdateStockFromInvoicesPayloadDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description: 'Array of invoice lines; supports snake_case or camelCase keys',
    example: [
      { batch_id: 'B1', item_id: 5, quantity: 2 },
      { batchId: 'B2', itemId: 7, quantity: 1 },
    ],
  })
  invoices!: Array<Record<string, any>>;
}
