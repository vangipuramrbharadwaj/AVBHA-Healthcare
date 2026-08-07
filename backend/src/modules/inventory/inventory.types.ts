export type StockDirection = "IN" | "OUT";

export interface InventoryDashboard {
  categories: number;
  items: number;
  stores: number;
  suppliers: number;
  lowStockItems: number;
  expiringBatches: number;
  pendingPurchaseOrders: number;
  pendingMaterialRequests: number;
}
