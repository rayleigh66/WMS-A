/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Material, 
  InventorySnapshot, 
  StockMovement, 
  MaterialAlert, 
  WmsDocument, 
  Warehouse, 
  Location, 
  UserRole,
  DocumentStatus,
  MovementType
} from '../types';

interface WmsContextType {
  materials: Material[];
  snapshots: InventorySnapshot[];
  movements: StockMovement[];
  alerts: MaterialAlert[];
  documents: WmsDocument[];
  warehouses: Warehouse[];
  locations: Location[];
  currentUserRole: UserRole;
  currentWarehouseCode: string;
  setCurrentUserRole: (role: UserRole) => void;
  setCurrentWarehouseCode: (code: string) => void;
  
  // Core Workflows
  addStockIn: (params: {
    materialCode: string;
    subType: '采购入库' | '生产退料' | '盘盈入库' | '其他入库';
    warehouseCode: string;
    locationCode: string;
    batchNo: string;
    quantity: number;
    remark?: string;
    operator: string;
  }) => { success: boolean; movementNo: string; prevQty: number; newQty: number; error?: string };

  addStockOut: (params: {
    materialCode: string;
    subType: '生产领料' | '样品领料' | '报废出库' | '盘亏出库' | '其他出库';
    department: string;
    warehouseCode: string;
    locationCode: string;
    batchNo: string;
    quantity: number;
    remark?: string;
    operator: string;
    forceManagerApproval?: boolean; // If true, manager bypassed the block
  }) => { success: boolean; movementNo: string; prevQty: number; newQty: number; gap: number; error?: string };

  addPhysicalCount: (params: {
    materialCode: string;
    warehouseCode: string;
    locationCode: string;
    batchNo: string;
    bookQty: number;
    realQty: number;
    reason?: string;
    remark?: string;
    operator: string;
  }) => { success: boolean; hasDifference: boolean; differenceQty: number; movementNo?: string };

  auditDocument: (documentNo: string, status: DocumentStatus, auditor: string) => void;
  resolveAlert: (alertNo: string, handler: string) => void;
  
  // Utility data setters (for settings / maintenance)
  addNewMaterial: (material: Material) => void;
  addNewLocation: (location: Location) => void;
  addNewWarehouse: (warehouse: Warehouse) => void;
}

const WmsContext = createContext<WmsContextType | undefined>(undefined);

export const WmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try to load initial data or persist in local storage
  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('wms_materials');
    return saved ? JSON.parse(saved) : [];
  });

  const [snapshots, setSnapshots] = useState<InventorySnapshot[]>(() => {
    const saved = localStorage.getItem('wms_snapshots');
    return saved ? JSON.parse(saved) : [];
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('wms_movements');
    return saved ? JSON.parse(saved) : [];
  });

  const [alerts, setAlerts] = useState<MaterialAlert[]>(() => {
    const saved = localStorage.getItem('wms_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  const [documents, setDocuments] = useState<WmsDocument[]>(() => {
    const saved = localStorage.getItem('wms_documents');
    return saved ? JSON.parse(saved) : [];
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem('wms_warehouses');
    return saved ? JSON.parse(saved) : [];
  });

  const [locations, setLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem('wms_locations');
    return saved ? JSON.parse(saved) : [];
  });

  // Current session configurations
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Admin');
  const [currentWarehouseCode, setCurrentWarehouseCode] = useState<string>('RAW-WH');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('wms_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('wms_snapshots', JSON.stringify(snapshots));
  }, [snapshots]);

  useEffect(() => {
    localStorage.setItem('wms_movements', JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem('wms_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('wms_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('wms_warehouses', JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem('wms_locations', JSON.stringify(locations));
  }, [locations]);

  // Helper: Format date string
  const formatNow = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // Helper: Format date slug for codes
  const getDateSlug = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  };

  // Triggered warning check logic for low stock and缺货 after inventory level changes
  const checkStockThresholdAndAlert = (materialCode: string, currentTotalQty: number, targetWarehouse: string, targetLoc: string) => {
    const material = materials.find(m => m.material_code === materialCode);
    if (!material) return;

    const safety = material.safety_stock;
    const isOutOfStock = currentTotalQty <= 0;
    const isUnderSafety = currentTotalQty < safety;

    setAlerts(prevAlerts => {
      let updated = [...prevAlerts];
      
      // 1. Check Out of stock alert
      if (isOutOfStock) {
        // If alert already exists, do nothing, otherwise add
        const exists = updated.some(a => a.material_code === materialCode && a.alert_type === '缺货' && a.status !== '已处理');
        if (!exists) {
          const newAlert: MaterialAlert = {
            alert_no: `AL-OOS-${getDateSlug()}-${Math.floor(1000 + Math.random() * 9000)}`,
            alert_type: '缺货',
            severity: '高',
            material_code: materialCode,
            material_name: material.material_name,
            current_qty: currentTotalQty,
            safety_stock: safety,
            shortage_qty: safety,
            warehouse_code: targetWarehouse,
            location_code: targetLoc,
            suggested_action: '物料库存清零！请立即催促采购，联系默认供应商：' + material.supplier,
            status: '未处理',
            created_at: formatNow(),
            handled_by: ''
          };
          updated.push(newAlert);
        }
      } else {
        // If restored from 0, auto-resolve "缺货" warning
        updated = updated.map(a => {
          if (a.material_code === materialCode && a.alert_type === '缺货' && a.status !== '已处理') {
            return { ...a, status: '已处理', handled_by: '系统自动恢复', current_qty: currentTotalQty };
          }
          return a;
        });
      }

      // 2. Check Low stock alert
      if (isUnderSafety && !isOutOfStock) {
        const exists = updated.some(a => a.material_code === materialCode && a.alert_type === '低库存' && a.status !== '已处理');
        if (!exists) {
          const newAlert: MaterialAlert = {
            alert_no: `AL-LOW-${getDateSlug()}-${Math.floor(1000 + Math.random() * 9000)}`,
            alert_type: '低库存',
            severity: '中',
            material_code: materialCode,
            material_name: material.material_name,
            current_qty: currentTotalQty,
            safety_stock: safety,
            shortage_qty: safety - currentTotalQty,
            warehouse_code: targetWarehouse,
            location_code: targetLoc,
            suggested_action: '库存低于安全限额！建议提交采购订单，最小订货量(MOQ): ' + material.min_order_qty + material.unit,
            status: '未处理',
            created_at: formatNow(),
            handled_by: ''
          };
          updated.push(newAlert);
        } else {
          // Update existing alert values
          updated = updated.map(a => {
            if (a.material_code === materialCode && a.alert_type === '低库存' && a.status !== '已处理') {
              return { ...a, current_qty: currentTotalQty, shortage_qty: safety - currentTotalQty };
            }
            return a;
          });
        }
      } else if (!isUnderSafety) {
        // If restored above safety, auto-resolve "低库存" warning
        updated = updated.map(a => {
          if (a.material_code === materialCode && a.alert_type === '低库存' && a.status !== '已处理') {
            return { ...a, status: '已处理', handled_by: '系统自动解除(库存充足)', current_qty: currentTotalQty };
          }
          return a;
        });
      }

      return updated;
    });
  };

  // CORE WORKFLOW: STOCK IN (入库扫码)
  const addStockIn = (params: {
    materialCode: string;
    subType: '采购入库' | '生产退料' | '盘盈入库' | '其他入库';
    warehouseCode: string;
    locationCode: string;
    batchNo: string;
    quantity: number;
    remark?: string;
    operator: string;
  }) => {
    const { materialCode, subType, warehouseCode, locationCode, batchNo, quantity, remark = '', operator } = params;
    
    const material = materials.find(m => m.material_code === materialCode);
    if (!material) {
      return { success: false, movementNo: '', prevQty: 0, newQty: 0, error: '物料主数据不存在' };
    }

    const warehouseName = getWarehouseName(warehouseCode);
    const locationName = getLocationName(locationCode);

    // Find if snapshot exists, or create one
    const snapshotId = `${materialCode}|${warehouseCode}|${locationCode}|${batchNo}`;
    let prevQty = 0;
    let newQty = 0;

    let updatedSnapshots = [...snapshots];
    const index = updatedSnapshots.findIndex(s => s.id === snapshotId);

    if (index >= 0) {
      prevQty = updatedSnapshots[index].physical_qty;
      newQty = prevQty + quantity;
      
      updatedSnapshots[index] = {
        ...updatedSnapshots[index],
        physical_qty: newQty,
        available_qty: updatedSnapshots[index].available_qty + quantity, // available increases by quantity
        last_movement_time: formatNow()
      };
    } else {
      prevQty = 0;
      newQty = quantity;
      
      const newSnapshot: InventorySnapshot = {
        id: snapshotId,
        material_code: materialCode,
        material_name: material.material_name,
        category: material.category,
        specification: material.specification,
        color: material.color,
        batch_no: batchNo,
        warehouse_code: warehouseCode,
        warehouse_name: warehouseName,
        location_code: locationCode,
        location_name: locationName,
        physical_qty: newQty,
        available_qty: newQty,
        reserved_qty: 0,
        locked_qty: 0,
        unit: material.unit,
        last_movement_time: formatNow(),
        last_count_time: '',
        stock_status: '正常'
      };
      updatedSnapshots.push(newSnapshot);
    }

    // Determine the general stock status of this material in this snapshot
    const finalSnapshots = updatedSnapshots.map(s => {
      if (s.material_code === materialCode) {
        // Re-evaluate safety stock across all warehouses of this material
        const matTotal = updatedSnapshots
          .filter(sh => sh.material_code === materialCode)
          .reduce((acc, sh) => acc + sh.physical_qty, 0);
        
        let status: '正常' | '低库存' | '缺货' = '正常';
        if (matTotal <= 0) status = '缺货';
        else if (matTotal < material.safety_stock) status = '低库存';
        
        return { ...s, stock_status: status };
      }
      return s;
    });

    setSnapshots(finalSnapshots);

    // Generate movement ledger
    const movementNo = `MV-IN-${getDateSlug()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newMovement: StockMovement = {
      movement_no: movementNo,
      movement_type: subType,
      material_code: materialCode,
      material_name: material.material_name,
      category: material.category,
      batch_no: batchNo,
      warehouse_code: warehouseCode,
      warehouse_name: warehouseName,
      location_code: locationCode,
      location_name: locationName,
      quantity_before: prevQty,
      quantity_change: quantity,
      quantity_after: newQty,
      unit: material.unit,
      related_document_no: `DOC-IN-${getDateSlug()}`,
      operator: operator,
      operation_time: formatNow(),
      remark: remark || `${subType}作业登记`
    };
    
    setMovements(prev => [newMovement, ...prev]);

    // Also auto-generate or append WMS documents
    const docNo = `IN-${getDateSlug()}-${Math.floor(100 + Math.random() * 900)}`;
    const newDoc: WmsDocument = {
      document_no: docNo,
      document_type: '入库单',
      sub_type: subType,
      status: '已完成',
      warehouse_code: warehouseCode,
      creator: operator.split(' ')[0],
      created_at: formatNow(),
      auditor: '钱主管',
      audited_at: formatNow(),
      remark: remark || `${subType}自动归档`,
      items: [
        {
          material_code: materialCode,
          material_name: material.material_name,
          specification: material.specification,
          color: material.color,
          unit: material.unit,
          batch_no: batchNo,
          location_code: locationCode,
          planned_qty: quantity,
          actual_qty: quantity,
          remark: '现场扫码入库'
        }
      ]
    };
    setDocuments(prev => [newDoc, ...prev]);

    // Calculate total material level quantity to trigger warning check
    const materialTotalQty = finalSnapshots
      .filter(s => s.material_code === materialCode)
      .reduce((acc, s) => acc + s.physical_qty, 0);

    checkStockThresholdAndAlert(materialCode, materialTotalQty, warehouseCode, locationCode);

    return { success: true, movementNo, prevQty, newQty };
  };

  // CORE WORKFLOW: STOCK OUT (出库扫码)
  const addStockOut = (params: {
    materialCode: string;
    subType: '生产领料' | '样品领料' | '报废出库' | '盘亏出库' | '其他出库';
    department: string;
    warehouseCode: string;
    locationCode: string;
    batchNo: string;
    quantity: number;
    remark?: string;
    operator: string;
    forceManagerApproval?: boolean;
  }) => {
    const { 
      materialCode, 
      subType, 
      department, 
      warehouseCode, 
      locationCode, 
      batchNo, 
      quantity, 
      remark = '', 
      operator,
      forceManagerApproval = false
    } = params;

    const material = materials.find(m => m.material_code === materialCode);
    if (!material) {
      return { success: false, movementNo: '', prevQty: 0, newQty: 0, gap: 0, error: '物料主数据不存在' };
    }

    const warehouseName = getWarehouseName(warehouseCode);
    const locationName = getLocationName(locationCode);

    const snapshotId = `${materialCode}|${warehouseCode}|${locationCode}|${batchNo}`;
    const snapItem = snapshots.find(s => s.id === snapshotId);
    const available = snapItem ? snapItem.available_qty : 0;
    
    const gap = quantity - available;

    // Strict validation: if available stock is not enough, and manager did not bypass
    if (gap > 0 && !forceManagerApproval) {
      // Auto-trigger High severity NEGATIVE STOCK alert / warning
      const alertNo = `AL-NEG-${getDateSlug()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setAlerts(prev => {
        // Only if alert doesn't exist yet
        if (prev.some(a => a.material_code === materialCode && a.alert_type === '负库存风险' && a.status !== '已处理')) {
          return prev;
        }
        const newAlert: MaterialAlert = {
          alert_no: alertNo,
          alert_type: '负库存风险',
          severity: '高',
          material_code: materialCode,
          material_name: material.material_name,
          current_qty: available,
          safety_stock: material.safety_stock,
          shortage_qty: gap,
          warehouse_code: warehouseCode,
          location_code: locationCode,
          suggested_action: `阻断出库！当前可用 ${available}，申请领用 ${quantity}，缺口 ${gap}。需主管级特批。`,
          status: '未处理',
          created_at: formatNow(),
          handled_by: ''
        };
        return [newAlert, ...prev];
      });

      return { success: false, movementNo: '', prevQty: available, newQty: available, gap, error: '库存不足' };
    }

    // Deduct stock
    let prevQty = snapItem ? snapItem.physical_qty : 0;
    let newQty = prevQty - quantity;

    let updatedSnapshots = [...snapshots];
    const index = updatedSnapshots.findIndex(s => s.id === snapshotId);

    if (index >= 0) {
      updatedSnapshots[index] = {
        ...updatedSnapshots[index],
        physical_qty: newQty,
        available_qty: updatedSnapshots[index].available_qty - quantity,
        last_movement_time: formatNow()
      };
    } else {
      // Negative stock allowed only if manager force-approved
      const newSnapshot: InventorySnapshot = {
        id: snapshotId,
        material_code: materialCode,
        material_name: material.material_name,
        category: material.category,
        specification: material.specification,
        color: material.color,
        batch_no: batchNo,
        warehouse_code: warehouseCode,
        warehouse_name: warehouseName,
        location_code: locationCode,
        location_name: locationName,
        physical_qty: -quantity,
        available_qty: -quantity,
        reserved_qty: 0,
        locked_qty: 0,
        unit: material.unit,
        last_movement_time: formatNow(),
        last_count_time: '',
        stock_status: '异常'
      };
      updatedSnapshots.push(newSnapshot);
    }

    // Determine the general stock status of this material in this snapshot
    const finalSnapshots = updatedSnapshots.map(s => {
      if (s.material_code === materialCode) {
        const matTotal = updatedSnapshots
          .filter(sh => sh.material_code === materialCode)
          .reduce((acc, sh) => acc + sh.physical_qty, 0);
        
        let status: '正常' | '低库存' | '缺货' | '异常' = '正常';
        if (matTotal < 0) status = '异常';
        else if (matTotal === 0) status = '缺货';
        else if (matTotal < material.safety_stock) status = '低库存';
        
        return { ...s, stock_status: status };
      }
      return s;
    });

    setSnapshots(finalSnapshots);

    // Save movement ledger
    const movementNo = `MV-OUT-${getDateSlug()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newMovement: StockMovement = {
      movement_no: movementNo,
      movement_type: subType,
      material_code: materialCode,
      material_name: material.material_name,
      category: material.category,
      batch_no: batchNo,
      warehouse_code: warehouseCode,
      warehouse_name: warehouseName,
      location_code: locationCode,
      location_name: locationName,
      quantity_before: prevQty,
      quantity_change: -quantity,
      quantity_after: newQty,
      unit: material.unit,
      related_document_no: `DOC-OUT-${getDateSlug()}`,
      operator: operator,
      operation_time: formatNow(),
      remark: `${subType} | 用途部门: ${department} | ${remark}`
    };

    setMovements(prev => [newMovement, ...prev]);

    // Also auto-generate WMS documents
    const docNo = `OUT-${getDateSlug()}-${Math.floor(100 + Math.random() * 900)}`;
    const newDoc: WmsDocument = {
      document_no: docNo,
      document_type: '出库单',
      sub_type: subType,
      status: '已完成',
      warehouse_code: warehouseCode,
      creator: operator.split(' ')[0],
      created_at: formatNow(),
      auditor: '钱主管',
      audited_at: formatNow(),
      remark: `${subType}到 ${department}`,
      items: [
        {
          material_code: materialCode,
          material_name: material.material_name,
          specification: material.specification,
          color: material.color,
          unit: material.unit,
          batch_no: batchNo,
          location_code: locationCode,
          planned_qty: quantity,
          actual_qty: quantity,
          remark: forceManagerApproval ? '主管现场特批超发' : '常规扫码出库'
        }
      ]
    };
    setDocuments(prev => [newDoc, ...prev]);

    // Clear negative alerts since it is now successfully executed (with authorization or enough quantity)
    if (gap <= 0) {
      setAlerts(prev => prev.map(a => {
        if (a.material_code === materialCode && a.alert_type === '负库存风险' && a.status !== '已处理') {
          return { ...a, status: '已处理', handled_by: '库存已扣减成功' };
        }
        return a;
      }));
    }

    // Evaluate final stock alert trigger
    const materialTotalQty = finalSnapshots
      .filter(s => s.material_code === materialCode)
      .reduce((acc, s) => acc + s.physical_qty, 0);

    checkStockThresholdAndAlert(materialCode, materialTotalQty, warehouseCode, locationCode);

    return { success: true, movementNo, prevQty, newQty, gap: 0 };
  };

  // CORE WORKFLOW: PHYSICAL COUNT (盘点扫码与自动流水调整)
  const addPhysicalCount = (params: {
    materialCode: string;
    warehouseCode: string;
    locationCode: string;
    batchNo: string;
    bookQty: number;
    realQty: number;
    reason?: string;
    remark?: string;
    operator: string;
  }) => {
    const { materialCode, warehouseCode, locationCode, batchNo, bookQty, realQty, reason = '', remark = '', operator } = params;
    
    const material = materials.find(m => m.material_code === materialCode);
    if (!material) {
      return { success: false, hasDifference: false, differenceQty: 0 };
    }

    const diffQty = realQty - bookQty;
    const hasDifference = diffQty !== 0;

    const snapshotId = `${materialCode}|${warehouseCode}|${locationCode}|${batchNo}`;
    let updatedSnapshots = [...snapshots];
    const index = updatedSnapshots.findIndex(s => s.id === snapshotId);

    // 1. Log the count task
    const docNo = `COUNT-${getDateSlug()}-${Math.floor(100 + Math.random() * 900)}`;
    const newDoc: WmsDocument = {
      document_no: docNo,
      document_type: '盘点单',
      sub_type: '随机抽盘',
      status: hasDifference ? '待审核' : '已完成', // If difference, goes to supervisor approval first!
      warehouse_code: warehouseCode,
      creator: operator.split(' ')[0],
      created_at: formatNow(),
      remark: `盘点人: ${operator}. ${hasDifference ? '有盘点差异：差异数 ' + diffQty : '实盘与账面完全一致'}`,
      items: [
        {
          material_code: materialCode,
          material_name: material.material_name,
          specification: material.specification,
          color: material.color,
          unit: material.unit,
          batch_no: batchNo,
          location_code: locationCode,
          planned_qty: bookQty,
          actual_qty: realQty,
          remark: hasDifference ? `差异原因: ${reason}` : '一致完成'
        }
      ]
    };
    
    setDocuments(prev => [newDoc, ...prev]);

    let movementNo = '';

    if (!hasDifference) {
      // No delta: simply update last count time
      if (index >= 0) {
        updatedSnapshots[index] = {
          ...updatedSnapshots[index],
          last_count_time: formatNow()
        };
        setSnapshots(updatedSnapshots);
      }
    } else {
      // There's a delta. In high-fidelity, let's auto-generate a MaterialAlert so managers can review.
      const alertNo = `AL-DIFF-${getDateSlug()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newAlert: MaterialAlert = {
        alert_no: alertNo,
        alert_type: '盘点差异',
        severity: '高',
        material_code: materialCode,
        material_name: material.material_name,
        current_qty: bookQty,
        safety_stock: material.safety_stock,
        shortage_qty: Math.abs(diffQty),
        warehouse_code: warehouseCode,
        location_code: locationCode,
        suggested_action: `盘点大差异：账面 ${bookQty}，实物 ${realQty}，差异 ${diffQty}。原因：${reason}。请审核并生成调整流水。`,
        status: '未处理',
        created_at: formatNow(),
        handled_by: ''
      };
      setAlerts(prev => [newAlert, ...prev]);

      // Auto-approve and apply the snapshot correction immediately
      if (index >= 0) {
        updatedSnapshots[index] = {
          ...updatedSnapshots[index],
          physical_qty: realQty,
          available_qty: realQty - (updatedSnapshots[index].reserved_qty), // adjust available
          last_count_time: formatNow(),
          last_movement_time: formatNow()
        };
      } else {
        // Create new
        const newSnapshot: InventorySnapshot = {
          id: snapshotId,
          material_code: materialCode,
          material_name: material.material_name,
          category: material.category,
          specification: material.specification,
          color: material.color,
          batch_no: batchNo,
          warehouse_code: warehouseCode,
          warehouse_name: getWarehouseName(warehouseCode),
          location_code: locationCode,
          location_name: getLocationName(locationCode),
          physical_qty: realQty,
          available_qty: realQty,
          reserved_qty: 0,
          locked_qty: 0,
          unit: material.unit,
          last_movement_time: formatNow(),
          last_count_time: formatNow(),
          stock_status: '正常'
        };
        updatedSnapshots.push(newSnapshot);
      }
      setSnapshots(updatedSnapshots);

      // Generate the compensating adjustment movement ledger
      movementNo = `MV-ADJ-${getDateSlug()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const adjType: MovementType = diffQty > 0 ? '盘盈入库' : '盘亏出库';
      const adjMovement: StockMovement = {
        movement_no: movementNo,
        movement_type: adjType,
        material_code: materialCode,
        material_name: material.material_name,
        category: material.category,
        batch_no: batchNo,
        warehouse_code: warehouseCode,
        warehouse_name: getWarehouseName(warehouseCode),
        location_code: locationCode,
        location_name: getLocationName(locationCode),
        quantity_before: bookQty,
        quantity_change: diffQty,
        quantity_after: realQty,
        unit: material.unit,
        related_document_no: docNo,
        operator: operator,
        operation_time: formatNow(),
        remark: `盘点调整 | 差异原因: ${reason}. ${remark}`
      };
      setMovements(prev => [adjMovement, ...prev]);

      // Trigger material re-evaluation for alerts
      const matTotal = updatedSnapshots
        .filter(s => s.material_code === materialCode)
        .reduce((acc, s) => acc + s.physical_qty, 0);
      checkStockThresholdAndAlert(materialCode, matTotal, warehouseCode, locationCode);
    }

    return { success: true, hasDifference, differenceQty: diffQty, movementNo: movementNo || undefined };
  };

  // AUDIT DOCUMENT FLOW (审核流程)
  const auditDocument = (documentNo: string, status: DocumentStatus, auditor: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.document_no === documentNo) {
        return { 
          ...doc, 
          status: status, 
          auditor: auditor, 
          audited_at: formatNow() 
        };
      }
      return doc;
    }));
  };

  // RESOLVE WARNING ALERTS (人工处理预警)
  const resolveAlert = (alertNo: string, handler: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.alert_no === alertNo) {
        return { 
          ...a, 
          status: '已处理', 
          handled_by: handler 
        };
      }
      return a;
    }));
  };

  // Maintenance setters
  const addNewMaterial = (material: Material) => {
    setMaterials(prev => [...prev, material]);
  };

  const addNewLocation = (location: Location) => {
    setLocations(prev => [...prev, location]);
  };

  const addNewWarehouse = (warehouse: Warehouse) => {
    setWarehouses(prev => [...prev, warehouse]);
  };

  return (
    <WmsContext.Provider value={{
      materials,
      snapshots,
      movements,
      alerts,
      documents,
      warehouses,
      locations,
      currentUserRole,
      currentWarehouseCode,
      setCurrentUserRole,
      setCurrentWarehouseCode,
      addStockIn,
      addStockOut,
      addPhysicalCount,
      auditDocument,
      resolveAlert,
      addNewMaterial,
      addNewLocation,
      addNewWarehouse
    }}>
      {children}
    </WmsContext.Provider>
  );
};

export const useWms = () => {
  const context = useContext(WmsContext);
  if (context === undefined) {
    throw new Error('useWms must be used within a WmsProvider');
  }
  return context;
};
