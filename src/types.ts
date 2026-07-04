/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User Roles
export type UserRole = 'Admin' | 'Warehouse Manager' | 'Warehouse Staff' | 'Purchaser' | 'PMC' | 'Finance';

// Movement Types
export type MovementType = '采购入库' | '生产退料' | '盘盈入库' | '其他入库' | '生产领料' | '样品领料' | '报废出库' | '盘亏出库' | '其他出库' | '移库调整' | '预留' | '释放';

// Inventory Status
export type StockStatus = '正常' | '低库存' | '缺货' | '异常';

// Alert Types
export type AlertType = '低库存' | '缺货' | '呆滞库存' | '盘点差异' | '负库存风险';

// Alert Severity
export type AlertSeverity = '高' | '中' | '低';

// Alert Status
export type AlertStatus = '未处理' | '处理中' | '已处理';

// Document Status
export type DocumentStatus = '草稿' | '待审核' | '已审核' | '已完成' | '已取消' | '已冲正';

// Warehouse Types
export type WarehouseType = '原材料仓' | '辅料仓' | '成品仓' | '外发仓';

// 1. Material Master Data (物料主数据)
export interface Material {
  material_code: string;       // SKU (e.g. FAB-210D-BK)
  material_name: string;       // 物料名称
  category: string;            // 分类 (面料、里布、拉链、拉头、五金、扣具、织带、包装、辅料)
  specification: string;       // 规格 (e.g. 210D, 5#, 25mm)
  color: string;               // 颜色 (黑色, 灰色, etc.)
  color_code: string;          // 颜色代码
  unit: string;                // 单位 (米, 码, 个, 套, 公斤, 卷)
  conversion_rate: string;     // 单位换算 (e.g. 1卷 = 100米)
  supplier: string;            // 默认供应商
  safety_stock: number;        // 安全库存
  min_order_qty: number;       // 最小采购量
  lead_time_days: number;      // 采购交期
  status: '启用' | '停用';      // 状态
  image: string;               // 物料图片 (base64 or placeholder)
  remark: string;              // 备注
}

// 2. Physical Inventory Snapshot (实时库存表)
export interface InventorySnapshot {
  id: string;                  // Unique combination (material_code + warehouse + location + batch_no)
  material_code: string;       // 物料编号
  material_name: string;       // 物料名称
  category: string;            // 分类
  specification: string;       // 规格
  color: string;               // 颜色
  batch_no: string;            // 批次号
  warehouse_code: string;      // 仓库编码
  warehouse_name: string;      // 仓库名称
  location_code: string;       // 库位编码
  location_name: string;       // 库位名称
  physical_qty: number;        // 实物库存数量
  available_qty: number;       // 可用库存 = 实物 - 预留
  reserved_qty: number;        // 预留库存
  locked_qty: number;          // 锁定库存
  unit: string;                // 单位
  last_movement_time: string;  // 最近异动时间
  last_count_time: string;     // 最近盘点时间
  stock_status: StockStatus;   // 库存状态
}

// 3. Stock Movement Ledger (出入库流水表)
export interface StockMovement {
  movement_no: string;         // 流水号 (e.g. MV-20260703-0001)
  movement_type: MovementType; // 移动类型
  material_code: string;       // 物料编号
  material_name: string;       // 物料名称
  category: string;            // 物料分类
  batch_no: string;            // 批次号
  warehouse_code: string;      // 仓库编码
  warehouse_name: string;      // 仓库名称
  location_code: string;       // 库位编码
  location_name: string;       // 库位名称
  quantity_before: number;     // 变动前数量
  quantity_change: number;     // 变动数量 (入库为正，出库为负)
  quantity_after: number;      // 变动后数量
  unit: string;                // 单位
  related_document_no: string; // 关联单据号
  operator: string;            // 操作人
  operation_time: string;      // 操作时间
  remark: string;              // 备注
}

// 4. Material Alert Table (物料预警表)
export interface MaterialAlert {
  alert_no: string;            // 预警编号 (e.g. AL-0001)
  alert_type: AlertType;       // 预警类型
  severity: AlertSeverity;     // 严重程度
  material_code: string;       // 物料编号
  material_name: string;       // 物料名称
  current_qty: number;         // 当前库存
  safety_stock: number;        // 安全库存
  shortage_qty: number;        // 缺口数量
  warehouse_code: string;      // 仓库
  location_code: string;       // 库位
  suggested_action: string;    // 建议动作
  status: AlertStatus;         // 状态
  created_at: string;          // 生成时间
  handled_by: string;          // 处理人
}

// 5. Warehouses, Zones, Bins (仓储结构)
export interface Warehouse {
  warehouse_code: string;
  warehouse_name: string;
  warehouse_type: WarehouseType;
  status: '启用' | '停用';
}

export interface Zone {
  zone_code: string;
  zone_name: string;
  warehouse_code: string;
  status: '启用' | '停用';
}

export interface Location {
  location_code: string;
  location_name: string;
  warehouse_code: string;
  zone_code: string;
  status: '启用' | '停用';
  barcode: string;             // barcode for location
}

// 6. Documents (单据数据，支持入库单、出库单、盘点单等)
export interface WmsDocument {
  document_no: string;         // 单据号
  document_type: '入库单' | '出库单' | '盘点单' | '移库单';
  sub_type: string;            // 采购入库、生产领料 等
  status: DocumentStatus;      // 状态
  warehouse_code: string;      // 仓库
  creator: string;             // 创建人
  created_at: string;          // 创建时间
  auditor?: string;            // 审核人
  audited_at?: string;         // 审核时间
  remark: string;
  items: DocumentItem[];       // 单据明细项
}

export interface DocumentItem {
  material_code: string;
  material_name: string;
  specification: string;
  color: string;
  unit: string;
  batch_no: string;
  location_code: string;
  planned_qty: number;         // 计划数量
  actual_qty: number;          // 实际数量 (实收、实发、实盘)
  remark?: string;
}
