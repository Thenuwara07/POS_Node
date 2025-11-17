import { MarginSummaryDto } from './margin-summary.dto';
import { ProductMarginDto } from './product-margin.dto';

export class MarginsResponseDto {
  summary: MarginSummaryDto;
  products: ProductMarginDto[];
}
