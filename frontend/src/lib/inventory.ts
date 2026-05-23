import type { StockLevel } from "@/components/ui/status-badge";

export function getStockLevel(available: number): StockLevel {
  if (available <= 0) return "out_of_stock";
  if (available <= 5) return "low_stock";
  return "in_stock";
}

export type ProductTableRow = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string | null;
  price: number;
  warehouseId: string;
  warehouseName: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  stockLevel: StockLevel;
};
