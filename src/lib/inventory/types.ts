export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unitCostEgp: number;
  createdAt: string;
  updatedAt: string;
};

export type InventoryOverview = {
  totalItems: number;
  lowStockCount: number;
  totalValueEgp: number;
  items: InventoryItem[];
};

export type InventoryStockStatus = "healthy" | "low" | "out";

export function getInventoryStockStatus(
  quantity: number,
  minThreshold: number,
): InventoryStockStatus {
  if (quantity <= 0) return "out";
  if (quantity <= minThreshold) return "low";
  return "healthy";
}

/** Visual bar fill: full at ~2× minimum threshold. */
export function getInventoryStockPercent(
  quantity: number,
  minThreshold: number,
): number {
  if (quantity <= 0) return 0;
  const ceiling = Math.max(minThreshold * 2, 1);
  return Math.min(100, Math.round((quantity / ceiling) * 100));
}

export const INVENTORY_CATEGORY_OPTIONS = [
  "خامات تجميل",
  "زراعة أسنان",
  "تخدير",
  "أدوات",
  "أدوية",
  "عام",
] as const;
