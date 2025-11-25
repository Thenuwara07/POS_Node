export class MarginSummaryDto {
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number; // 0..100
  itemsSold: number;
  transactions: number;
}
