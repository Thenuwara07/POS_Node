export class ItemDto {
  id: number;          // Item ID
  name: string;        // Item Name
  quantity: number;    // Sum of all Stock.quantity for this item
  unitPrice: number;   // From latest Stock row for this item
  sellPrice: number;   // From latest Stock row for this item
  totalSales: number;  // quantity * sellPrice
}
