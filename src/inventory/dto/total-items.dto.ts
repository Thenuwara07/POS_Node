export class ItemDto {
  id: number;
  name: string;
  barcode: string;
  category: {
    id: number;
    category: string;
    colorCode: string;
  };
  supplier: {
    id: number;
    name: string;
    contact: string;
    colorCode: string;
  };
  reorderLevel: number;
  gradient?: string;
  remark?: string;
  colorCode: string;
}
