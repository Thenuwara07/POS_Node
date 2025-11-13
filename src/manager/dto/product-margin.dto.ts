export class ProductMarginDto {
  itemId: number;
  name: string;
  category: string | null;
  sold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number; // 0..100
}
