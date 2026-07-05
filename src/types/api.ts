// API types matching backend camelCase responses

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: Department | null;
  status: UserStatus;
  createdAt: string;
}

export type Role = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'DISABLED';
export type Department = 'WAREHOUSE' | 'PURCHASING' | 'PMC' | 'FINANCE' | 'ADMIN' | 'OTHER';

export interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  category: ItemCategory;
  specification: string | null;
  color: string | null;
  unit: string;
  supplier: string | null;
  safetyStock: number;
  status: ItemStatus;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ItemCategory = 'FABRIC' | 'ZIPPER' | 'HARDWARE' | 'LINING' | 'PACKAGING' | 'ACCESSORY' | 'SEMI_FINISHED' | 'FINISHED_GOODS' | 'OTHER';
export type ItemStatus = 'ACTIVE' | 'DISABLED';

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  FABRIC: '面料', ZIPPER: '拉链', HARDWARE: '五金',
  LINING: '里布', PACKAGING: '包装材料', ACCESSORY: '辅料',
  SEMI_FINISHED: '半成品', FINISHED_GOODS: '成品', OTHER: '其他',
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: '管理员', MANAGER: '仓库主管', OPERATOR: '操作员', VIEWER: '只读用户',
};

export const STOCK_IN_TYPE_LABELS: Record<string, string> = {
  PURCHASE: '采购入库', PRODUCTION_RETURN: '生产退料入库',
  INVENTORY_GAIN: '盘盈入库', OTHER: '其他入库',
};

export const STOCK_OUT_TYPE_LABELS: Record<string, string> = {
  PRODUCTION_PICKING: '生产领料出库', SALES: '销售出库',
  SCRAP: '报废出库', INVENTORY_LOSS: '盘亏出库', OTHER: '其他出库',
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  STOCK_IN: '入库', STOCK_OUT: '出库', ADJUSTMENT: '调整',
  TRANSFER_IN: '调拨入库', TRANSFER_OUT: '调拨出库',
};

export interface Warehouse {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  status: string;
  remark: string | null;
  locations?: Location[];
}

export interface Location {
  id: string;
  locationCode: string;
  locationName: string;
  warehouseId: string;
  status: string;
  remark: string | null;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  category: ItemCategory;
  specification: string | null;
  color: string | null;
  unit: string;
  safetyStock: number;
  itemStatus: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  locationId: string;
  locationCode: string;
  locationName: string;
  quantity: number;
  updatedAt: string;
}

export interface StockInOrder {
  id: string;
  orderNo: string;
  type: string;
  warehouseId: string;
  operatorId: string;
  remark: string | null;
  createdAt: string;
  warehouse: { warehouseCode: string; warehouseName: string };
  operator: { name: string };
  items: StockInOrderItem[];
}

export interface StockInOrderItem {
  id: string;
  orderId: string;
  itemId: string;
  locationId: string;
  quantity: number;
  unit: string;
  remark: string | null;
  item: { itemCode: string; itemName: string; unit: string };
  location: { locationCode: string; locationName: string };
}

export interface StockOutOrder {
  id: string;
  orderNo: string;
  type: string;
  warehouseId: string;
  operatorId: string;
  remark: string | null;
  createdAt: string;
  warehouse: { warehouseCode: string; warehouseName: string };
  operator: { name: string };
  items: StockOutOrderItem[];
}

export interface StockOutOrderItem {
  id: string;
  orderId: string;
  itemId: string;
  locationId: string;
  quantity: number;
  unit: string;
  remark: string | null;
  item: { itemCode: string; itemName: string; unit: string };
  location: { locationCode: string; locationName: string };
}

export interface StockAdjustment {
  id: string;
  adjustmentNo: string;
  warehouseId: string;
  operatorId: string;
  reason: string;
  remark: string | null;
  createdAt: string;
  warehouse: { warehouseCode: string; warehouseName: string };
  operator: { name: string };
  items: StockAdjustmentItem[];
}

export interface StockAdjustmentItem {
  id: string;
  adjustmentId: string;
  itemId: string;
  locationId: string;
  quantityBefore: number;
  quantityAfter: number;
  quantityChange: number;
  unit: string;
  remark: string | null;
  item: { itemCode: string; itemName: string; unit: string };
  location: { locationCode: string; locationName: string };
}

export interface StockMovement {
  id: string;
  movementNo: string;
  itemId: string;
  warehouseId: string;
  locationId: string;
  movementType: string;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  sourceType: string;
  sourceId: string;
  operatorId: string;
  remark: string | null;
  createdAt: string;
  item: { itemCode: string; itemName: string };
  warehouse: { warehouseCode: string; warehouseName: string };
  location: { locationCode: string; locationName: string };
  operator: { name: string };
}

export interface OperationLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  detail: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { name: string; email: string };
}

export interface DashboardData {
  totalItems: number;
  totalInventoryQuantity: string;
  lowStockItems: number;
  todayStockInQuantity: string;
  todayStockOutQuantity: string;
  recentMovements: StockMovement[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  path?: string;
}
