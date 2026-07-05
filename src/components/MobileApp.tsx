/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  useWms 
} from '../context/WmsContext';
import { 
  QrCode, 
  ArrowLeftRight, 
  ClipboardCheck, 
  History, 
  User, 
  Home, 
  ArrowLeft, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  MapPin, 
  Layers, 
  HelpCircle,
  Truck,
  Scan,
  Smartphone,
  ShieldCheck,
  Warehouse
} from 'lucide-react';
import ScanSimulator from './ScanSimulator';
import { Material, Location, InventorySnapshot, UserRole } from '../types';

export default function MobileApp() {
  const { 
    materials, 
    snapshots, 
    movements, 
    alerts, 
    locations, 
    currentUserRole, 
    currentWarehouseCode,
    setCurrentUserRole,
    setCurrentWarehouseCode,
    addStockIn,
    addStockOut,
    addPhysicalCount,
    warehouses
  } = useWms();

  // Bottom navigation state
  const [activeTab, setActiveTab] = useState<'home' | 'logs' | 'check_stock' | 'me'>('home');

  // Check Stock state
  const [checkedMaterial, setCheckedMaterial] = useState<Material | null>(null);
  const [checkedLocation, setCheckedLocation] = useState<Location | null>(null);

  // Scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanExpectedType, setScanExpectedType] = useState<'material' | 'location' | 'batch' | 'document' | 'all'>('all');
  const [scanCallback, setScanCallback] = useState<(val: string) => void>(() => () => {});

  // Active Wizard flow: null | 'in' | 'out' | 'count'
  const [activeFlow, setActiveFlow] = useState<null | 'in' | 'out' | 'count'>(null);
  
  // Wizard Steps
  // Flow 'in' steps: 1 (Scan Mat), 2 (Select Type), 3 (Select Loc), 4 (Qty), 5 (Success)
  // Flow 'out' steps: 1 (Scan Mat), 2 (Select Type & Dept), 3 (Qty & Validate), 4 (Success)
  // Flow 'count' steps: 1 (Scan Mat/Loc), 2 (Select Item), 3 (Qty), 4 (Diff & Submit), 5 (Success)
  const [flowStep, setFlowStep] = useState(1);

  // Form states
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedBatch, setSelectedBatch] = useState('BATCH-2026-0610');
  const [inType, setInType] = useState<'采购入库' | '生产退料' | '盘盈入库' | '其他入库'>('采购入库');
  
  const [outType, setOutType] = useState<'生产领料' | '样品领料' | '报废出库' | '盘亏出库' | '其他出库'>('生产领料');
  const [outDepartment, setOutDepartment] = useState('裁床');
  
  const [quantity, setQuantity] = useState<number | string>(10);
  const [remark, setRemark] = useState('');

  // Physical counting form states
  const [countedSnapshot, setCountedSnapshot] = useState<InventorySnapshot | null>(null);
  const [realCountQty, setRealCountQty] = useState<number | string>(0);
  const [countReason, setCountReason] = useState('上次漏扫');

  // Success screen display data
  const [successResult, setSuccessResult] = useState<{
    movementNo: string;
    materialName: string;
    prevQty: number;
    changeQty: number;
    newQty: number;
    locationCode: string;
  } | null>(null);

  // Error/Alert info during flow
  const [flowError, setFlowError] = useState('');

  // Trigger scanning popup
  const startScanning = (expected: 'material' | 'location' | 'batch' | 'document' | 'all', callback: (val: string) => void) => {
    setScanExpectedType(expected);
    setScanCallback(() => callback);
    setScannerOpen(true);
  };

  // Check Stock scan processing
  const handleCheckStockCode = (code: string) => {
    // Try to find material
    const mat = materials.find(m => m.material_code.toLowerCase() === code.trim().toLowerCase());
    if (mat) {
      setCheckedMaterial(mat);
      setCheckedLocation(null);
      setActiveTab('check_stock');
      return;
    }

    // Try to find location
    const loc = locations.find(l => l.location_code.toLowerCase() === code.trim().toLowerCase() || l.barcode.toLowerCase() === code.trim().toLowerCase());
    if (loc) {
      setCheckedLocation(loc);
      setCheckedMaterial(null);
      setActiveTab('check_stock');
      return;
    }

    alert(`无法识别的条码或编号: "${code}"。请输入或扫描正确的物料编号 (e.g. FAB-210D-BK) 或物理库位编码 (e.g. A01-01-01)。`);
  };

  // Reset all flow states to go back to Home
  const resetFlow = () => {
    setActiveFlow(null);
    setFlowStep(1);
    setSelectedMaterial(null);
    setSelectedLocation(null);
    setSelectedBatch('BATCH-2026-0610');
    setQuantity(10);
    setRemark('');
    setCountedSnapshot(null);
    setRealCountQty(0);
    setCountReason('上次漏扫');
    setSuccessResult(null);
    setFlowError('');
  };

  // Submit Stock In
  const handleStockInSubmit = () => {
    if (!selectedMaterial || !selectedLocation) return;
    
    const operatorName = `员工小张 (${currentUserRole})`;
    const result = addStockIn({
      materialCode: selectedMaterial.material_code,
      subType: inType,
      warehouseCode: currentWarehouseCode,
      locationCode: selectedLocation.location_code,
      batchNo: selectedBatch,
      quantity: Number(quantity),
      remark: remark,
      operator: operatorName
    });

    if (result.success) {
      setSuccessResult({
        movementNo: result.movementNo,
        materialName: selectedMaterial.material_name,
        prevQty: result.prevQty,
        changeQty: Number(quantity),
        newQty: result.newQty,
        locationCode: selectedLocation.location_code
      });
      setFlowStep(5); // Show success view
    } else {
      setFlowError(result.error || '入库失败');
    }
  };

  // Submit Stock Out
  const handleStockOutSubmit = (forceBypass = false) => {
    if (!selectedMaterial || !selectedLocation) return;

    const operatorName = `员工小张 (${currentUserRole})`;
    const result = addStockOut({
      materialCode: selectedMaterial.material_code,
      subType: outType,
      department: outDepartment,
      warehouseCode: currentWarehouseCode,
      locationCode: selectedLocation.location_code,
      batchNo: selectedBatch,
      quantity: Number(quantity),
      remark: remark,
      operator: operatorName,
      forceManagerApproval: forceBypass
    });

    if (result.success) {
      setSuccessResult({
        movementNo: result.movementNo,
        materialName: selectedMaterial.material_name,
        prevQty: result.prevQty,
        changeQty: -Number(quantity),
        newQty: result.newQty,
        locationCode: selectedLocation.location_code
      });
      setFlowStep(4); // Show success view
    } else {
      // Stock is insufficient, display error
      setFlowError(result.error || '出库失败');
    }
  };

  // Submit Physical Count
  const handlePhysicalCountSubmit = () => {
    if (!countedSnapshot) return;

    const operatorName = `员工小张 (${currentUserRole})`;
    const result = addPhysicalCount({
      materialCode: countedSnapshot.material_code,
      warehouseCode: countedSnapshot.warehouse_code,
      locationCode: countedSnapshot.location_code,
      batchNo: countedSnapshot.batch_no,
      bookQty: countedSnapshot.physical_qty,
      realQty: Number(realCountQty),
      reason: Number(realCountQty) !== countedSnapshot.physical_qty ? countReason : '',
      remark: '手机现场快速盘点',
      operator: operatorName
    });

    if (result.success) {
      setSuccessResult({
        movementNo: result.movementNo || 'N/A',
        materialName: countedSnapshot.material_name,
        prevQty: countedSnapshot.physical_qty,
        changeQty: Number(realCountQty) - countedSnapshot.physical_qty,
        newQty: Number(realCountQty),
        locationCode: countedSnapshot.location_code
      });
      setFlowStep(5); // Show success
    } else {
      setFlowError('盘点提交失败');
    }
  };

  // Helper Quick Adjustment Buttons for quantities
  const adjustQty = (amount: number) => {
    setQuantity(prev => { const num = Number(prev) || 0; return Math.max(1, Number((num + amount).toFixed(2))); });
  };

  const adjustRealCountQty = (amount: number) => {
    setRealCountQty(prev => { const num = Number(prev) || 0; return Math.max(0, Number((num + amount).toFixed(2))); });
  };

  // Filter logs for logs page (recent scanned items)
  const workerLogs = movements.filter(m => m.operator.includes('员工小张') || m.operator.includes('张仓管') || m.operator.includes('李五金'));

  return (
    <div className="mx-auto max-w-md bg-slate-50 min-h-[700px] flex flex-col justify-between border border-slate-200 rounded-3xl overflow-hidden shadow-xl font-sans text-slate-800">
      
      {/* Top Mobile Bar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center select-none border-b border-slate-800">
        <div className="flex items-center gap-1">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs tracking-wider">FACTORY PDA SIMULATOR</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
            {currentWarehouseCode === 'RAW-WH' ? 'RAW 原材料仓' : currentWarehouseCode === 'ACC-WH' ? 'ACC 五金辅料仓' : 'SAMPLE 样品仓'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">STAFF-ONLINE</span>
        </div>
      </div>

      {/* Main Screen Panel */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {activeFlow === null ? (
          <>
            {/* Tab: HOME (大按钮主页) */}
            {activeTab === 'home' && (
              <div className="flex-1 flex flex-col justify-between space-y-6 py-2">
                {/* Header Welcome Card */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-wider mb-2">Factory WMS</h2>
                    <div className="space-y-1 mt-3">
                      <h3 className="font-semibold text-sm text-slate-300 flex items-center gap-1.5"><Warehouse className="w-4 h-4"/> 原材料仓</h3>
                      <h3 className="font-semibold text-sm text-slate-300 flex items-center gap-1.5"><User className="w-4 h-4"/> 张仓管</h3>
                    </div>
                  </div>
                  <Package className="w-12 h-12 text-slate-700 stroke-[1.5] mr-2" />
                </div>

                {/* The 3 Giant Buttons requested by the user */}
                <div className="space-y-4 flex-1 flex flex-col justify-center">
                  
                  {/* 1. 入库扫码 (Green) */}
                  <button
                    onClick={() => {
                      setActiveFlow('in');
                      setFlowStep(1);
                    }}
                    className="w-full py-6 px-5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all rounded-2xl text-white flex items-center justify-between shadow-lg shadow-emerald-900/10 group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-3 bg-emerald-700/60 rounded-xl group-hover:scale-110 transition-transform">
                        <QrCode className="w-8 h-8 text-emerald-200" />
                      </div>
                      <div>
                        <span className="block text-lg font-bold">入库扫码</span>
                        <span className="text-xs text-emerald-100 font-medium">采购入库 • 生产退料作业登记</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-700/40 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-emerald-200" />
                    </div>
                  </button>

                  {/* 2. 出库扫码 (Blue) */}
                  <button
                    onClick={() => {
                      setActiveFlow('out');
                      setFlowStep(1);
                    }}
                    className="w-full py-6 px-5 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] transition-all rounded-2xl text-white flex items-center justify-between shadow-lg shadow-sky-900/10 group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-3 bg-sky-700/60 rounded-xl group-hover:scale-110 transition-transform">
                        <ArrowLeftRight className="w-8 h-8 text-sky-200" />
                      </div>
                      <div>
                        <span className="block text-lg font-bold">出库扫码</span>
                        <span className="text-xs text-sky-100 font-medium">生产领料 • 样品领用及超发校验</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-sky-700/40 flex items-center justify-center">
                      <Minus className="w-5 h-5 text-sky-200" />
                    </div>
                  </button>

                  {/* 3. 盘点扫码 (Purple/Dark) */}
                  <button
                    onClick={() => {
                      setActiveFlow('count');
                      setFlowStep(1);
                    }}
                    className="w-full py-6 px-5 bg-purple-700 hover:bg-purple-600 active:scale-[0.98] transition-all rounded-2xl text-white flex items-center justify-between shadow-lg shadow-purple-900/10 group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-3 bg-purple-800/60 rounded-xl group-hover:scale-110 transition-transform">
                        <ClipboardCheck className="w-8 h-8 text-purple-200" />
                      </div>
                      <div>
                        <span className="block text-lg font-bold">盘点扫码</span>
                        <span className="text-xs text-purple-100 font-medium">库位实盘 • 账面盘点比对</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-800/40 flex items-center justify-center">
                      <Scan className="w-5 h-5 text-purple-200" />
                    </div>
                  </button>

                  {/* 4. 扫码查库存 (Auxiliary Entry) */}
                  <div className="pt-2">
                    <span className="block text-xs font-bold text-gray-500 mb-3 px-1 uppercase tracking-wider">辅助功能</span>
                    <button
                      onClick={() => {
                        setActiveTab('check_stock');
                        startScanning('all', (val) => {
                          handleCheckStockCode(val);
                        });
                      }}
                      className="w-full py-4 px-5 bg-white border border-gray-200 active:bg-gray-50 active:scale-[0.98] transition-all rounded-2xl text-gray-800 flex items-center justify-between shadow-sm hover:shadow-md group cursor-pointer"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="p-2.5 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">
                          <Scan className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <span className="block text-sm font-bold">查库存</span>
                          <span className="text-[11px] text-gray-500 font-medium">快捷查询物料可用量、分库位明细及预警</span>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                        <QrCode className="w-4 h-4 text-emerald-600" />
                      </div>
                    </button>
                  </div>

                </div>

                {/* Quick warning list matching active warehouse */}
                {alerts.filter(a => a.warehouse_code === currentWarehouseCode && a.status === '未处理').length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-amber-800">当前仓库存在物料预警提示</span>
                      <p className="text-amber-700 mt-0.5 text-[11px] leading-relaxed">
                        有 {alerts.filter(a => a.warehouse_code === currentWarehouseCode && a.status === '未处理').length} 个物料处于低库存或缺货，请在电脑端审核采购或在扫码时重点核实。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: CHECK_STOCK */}
            {activeTab === 'check_stock' && (
              <div className="flex-1 flex flex-col space-y-4">
                {/* Header section */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                    <Scan className="w-4 h-4 text-emerald-600" />
                    扫码查库存
                  </h3>
                  <button
                    onClick={() => {
                      startScanning('all', (val) => {
                        handleCheckStockCode(val);
                      });
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5" /> 扫一扫
                  </button>
                </div>

                {/* If nothing selected or scanned yet, show selector/simulator */}
                {!checkedMaterial && !checkedLocation ? (
                  <div className="flex-1 flex flex-col justify-center py-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                      <Scan className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-700">请扫描物料条码或库位二维码</h4>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed mt-1">
                        点击右上角“扫一扫”进行现场扫描，或直接点击下方列表的任何一项进行模拟查验。
                      </p>
                    </div>

                    {/* Quick presets for material & location simulator inside the tab */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 text-left shadow-xs">
                      <span className="block text-xs font-bold text-gray-500 mb-2">快捷模拟点选：</span>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">常用物料 SKU (物料二维码)：</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {materials.slice(0, 4).map(m => (
                              <button
                                key={m.material_code}
                                onClick={() => handleCheckStockCode(m.material_code)}
                                className="p-1.5 bg-gray-50 hover:bg-emerald-50 border border-gray-150 hover:border-emerald-500 rounded-lg text-[10px] text-left font-mono transition-colors cursor-pointer"
                              >
                                <span className="font-bold text-gray-700 block truncate">{m.material_code}</span>
                                <span className="text-[9px] text-gray-400 block truncate">{m.material_name}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">常用库位 (库位二维码)：</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {locations.filter(l => l.warehouse_code === currentWarehouseCode).slice(0, 4).map(l => (
                              <button
                                key={l.location_code}
                                onClick={() => handleCheckStockCode(l.location_code)}
                                className="p-1.5 bg-gray-50 hover:bg-emerald-50 border border-gray-150 hover:border-emerald-500 rounded-lg text-[10px] text-left font-mono transition-colors cursor-pointer"
                              >
                                <span className="font-bold text-amber-600 block">{l.location_code}</span>
                                <span className="text-[9px] text-gray-400 block truncate">{l.location_name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Displaying details */
                  <div className="space-y-4 flex-1">
                    
                    {/* Back Button to scan list */}
                    <button
                      onClick={() => {
                        setCheckedMaterial(null);
                        setCheckedLocation(null);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 font-bold bg-white border border-gray-200 py-1 px-2.5 rounded-lg transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" /> 重选其它条码
                    </button>

                    {/* ================= CASE A: MATERIAL DETAILS ================= */}
                    {checkedMaterial && (
                      <div className="space-y-4">
                        {/* 1. Header Card */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3 flex gap-3 shadow-xs">
                          <img src={checkedMaterial.image} className="w-14 h-14 rounded-lg object-cover bg-gray-50 shrink-0 border border-gray-100" alt="" />
                          <div className="text-xs space-y-0.5">
                            <span className="font-mono font-black text-gray-800 text-sm block">{checkedMaterial.material_code}</span>
                            <span className="font-bold text-gray-600 block">{checkedMaterial.material_name}</span>
                            <span className="text-gray-400 block text-[10px]">分类: {checkedMaterial.category} | 规格: {checkedMaterial.specification} | 颜色: {checkedMaterial.color}</span>
                          </div>
                        </div>

                        {/* 2. Stock Grid */}
                        {(() => {
                          const materialSnaps = snapshots.filter(s => s.material_code === checkedMaterial.material_code);
                          const totalPhys = materialSnaps.reduce((sum, s) => sum + s.physical_qty, 0);
                          const totalAvail = materialSnaps.reduce((sum, s) => sum + s.available_qty, 0);
                          const totalRes = materialSnaps.reduce((sum, s) => sum + s.reserved_qty, 0);
                          const totalLoc = materialSnaps.reduce((sum, s) => sum + s.locked_qty, 0);

                          let stockStatus: '正常' | '低库存' | '缺货' = '正常';
                          if (totalPhys === 0) {
                            stockStatus = '缺货';
                          } else if (totalPhys < checkedMaterial.safety_stock) {
                            stockStatus = '低库存';
                          }

                          return (
                            <div className="space-y-3">
                              {/* Giant figures */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-xs">
                                  <span className="text-[10px] font-bold text-gray-400 block">实物总库存</span>
                                  <span className="text-xl font-black text-gray-800 mt-1 block font-mono">{totalPhys} <span className="text-xs font-normal text-gray-500">{checkedMaterial.unit}</span></span>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-xs">
                                  <span className="text-[10px] font-bold text-gray-400 block">可用配给数</span>
                                  <span className="text-xl font-black text-emerald-600 mt-1 block font-mono">{totalAvail} <span className="text-xs font-normal text-gray-500">{checkedMaterial.unit}</span></span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-[10px]">
                                <div className="bg-white border border-gray-150 p-2 rounded-lg text-center">
                                  <span className="text-gray-400 block font-medium">预留库存</span>
                                  <span className="font-bold text-gray-700 block mt-0.5 font-mono">{totalRes} {checkedMaterial.unit}</span>
                                </div>
                                <div className="bg-white border border-gray-150 p-2 rounded-lg text-center">
                                  <span className="text-gray-400 block font-medium">锁定库存</span>
                                  <span className="font-bold text-gray-700 block mt-0.5 font-mono">{totalLoc} {checkedMaterial.unit}</span>
                                </div>
                                <div className="bg-white border border-gray-150 p-2 rounded-lg text-center">
                                  <span className="text-gray-400 block font-medium">安全库存</span>
                                  <span className="font-bold text-gray-700 block mt-0.5 font-mono">{checkedMaterial.safety_stock} {checkedMaterial.unit}</span>
                                </div>
                              </div>

                              {/* Stock status badge bar */}
                              <div className="bg-white border border-gray-200 rounded-xl p-2.5 flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-500">库存监控状态：</span>
                                <span className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                                  stockStatus === '缺货' ? 'bg-red-50 text-red-700 border border-red-150' :
                                  stockStatus === '低库存' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                                  'bg-emerald-50 text-emerald-700 border border-emerald-150'
                                }`}>
                                  ● {stockStatus}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 3. Location breakdown details */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs space-y-2">
                          <h4 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-1.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            分库位实时快照
                          </h4>
                          {(() => {
                            const materialSnaps = snapshots.filter(s => s.material_code === checkedMaterial.material_code);
                            if (materialSnaps.length === 0) {
                              return <p className="text-[11px] text-gray-400 py-2">暂无分库位实存数据</p>;
                            }
                            return (
                              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                {materialSnaps.map(s => (
                                  <div key={s.id} className="flex justify-between items-center text-[11px] bg-gray-50 p-2 rounded-lg border border-gray-100 font-mono">
                                    <div>
                                      <span className="font-bold text-amber-600">{s.location_code}</span>
                                      <span className="text-[9px] text-gray-400 block">{s.warehouse_name} • {s.batch_no}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-bold text-gray-700 block">{s.physical_qty} {s.unit}</span>
                                      <span className="text-[9px] text-gray-400 block font-sans">可用 {s.available_qty} {s.unit}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* 4. Recent 3 Movements */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs space-y-2">
                          <h4 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-1.5 flex items-center gap-1">
                            <History className="w-3.5 h-3.5 text-emerald-600" />
                            最近 3 条出入库流水记录
                          </h4>
                          {(() => {
                            const matchedMovements = movements
                              .filter(m => m.material_code === checkedMaterial.material_code)
                              .slice(0, 3);
                            
                            if (matchedMovements.length === 0) {
                              return <p className="text-[11px] text-gray-400 py-2">暂无本物料的扫码交易流水</p>;
                            }

                            return (
                              <div className="space-y-2">
                                {matchedMovements.map(m => (
                                  <div key={m.movement_no} className="text-[11px] border-b border-gray-50 last:border-b-0 pb-1.5 last:pb-0">
                                    <div className="flex justify-between font-mono">
                                      <span className="font-bold text-gray-600">{m.movement_type}</span>
                                      <span className={`font-bold ${m.quantity_change > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change} {m.unit}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                      <span>库位: {m.location_code} | 操作: {m.operator.split(' ')[0]}</span>
                                      <span className="font-mono">{m.operation_time.split(' ')[0]}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* 5. Material Alerts */}
                        {(() => {
                          const matAlerts = alerts.filter(a => a.material_code === checkedMaterial.material_code && a.status !== '已处理');
                          if (matAlerts.length > 0) {
                            return (
                              <div className="bg-red-50 border border-red-150 rounded-xl p-3 space-y-1.5">
                                <span className="font-bold text-red-800 text-[11px] flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                  该物料相关预警 ({matAlerts.length} 项未处理)
                                </span>
                                <div className="space-y-1">
                                  {matAlerts.map(a => (
                                    <div key={a.alert_no} className="text-[10px] text-red-700 leading-relaxed font-mono">
                                      • [{a.alert_type}] 严重程度:{a.severity} | 当前:{a.current_qty} | 建议:{a.suggested_action}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* 6. Read only notice & action buttons */}
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[10px] leading-relaxed text-amber-800">
                          <span className="font-bold block mb-0.5">⚠️ 手机端查库存是只读辅助功能</span>
                          此处库存数据不能手工直接修改。所有库存变化必须通过真实的入库、出库、盘点扫码，产生审计流水后系统自动更新，以保障一物一码的高一致性。
                        </div>

                        {/* Shortcut Actions */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              setActiveFlow('in');
                              setSelectedMaterial(checkedMaterial);
                              setFlowStep(2);
                            }}
                            className="py-2.5 px-1 bg-emerald-600 hover:bg-emerald-755 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer text-center"
                          >
                            入库
                          </button>
                          <button
                            onClick={() => {
                              setActiveFlow('out');
                              setSelectedMaterial(checkedMaterial);
                              // Auto match a snapshot bin if exists to simplify employee step
                              const matchedSnap = snapshots.find(s => s.material_code === checkedMaterial.material_code && s.warehouse_code === currentWarehouseCode && s.physical_qty > 0);
                              if (matchedSnap) {
                                const matchedLoc = locations.find(l => l.location_code === matchedSnap.location_code);
                                if (matchedLoc) setSelectedLocation(matchedLoc);
                              } else {
                                const defaultLoc = locations.find(l => l.warehouse_code === currentWarehouseCode);
                                if (defaultLoc) setSelectedLocation(defaultLoc);
                              }
                              setFlowStep(2);
                            }}
                            className="py-2.5 px-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer text-center"
                          >
                            出库
                          </button>
                          <button
                            onClick={() => {
                              setActiveFlow('count');
                              const snapItems = snapshots.filter(s => s.material_code === checkedMaterial.material_code && s.warehouse_code === currentWarehouseCode);
                              if (snapItems.length > 0) {
                                setCountedSnapshot(snapItems[0]);
                                setRealCountQty(snapItems[0].physical_qty);
                                setFlowStep(3); // Go to input
                              } else {
                                // Default mock template
                                const mockSnap: InventorySnapshot = {
                                  id: `${checkedMaterial.material_code}|${currentWarehouseCode}|A01-01-01|BATCH-2026-0610`,
                                  material_code: checkedMaterial.material_code,
                                  material_name: checkedMaterial.material_name,
                                  category: checkedMaterial.category,
                                  specification: checkedMaterial.specification,
                                  color: checkedMaterial.color,
                                  batch_no: 'BATCH-2026-0610',
                                  warehouse_code: currentWarehouseCode,
                                  warehouse_name: getWarehouseName(currentWarehouseCode),
                                  location_code: 'A01-01-01',
                                  location_name: getLocationName('A01-01-01'),
                                  physical_qty: 0,
                                  available_qty: 0,
                                  reserved_qty: 0,
                                  locked_qty: 0,
                                  unit: checkedMaterial.unit,
                                  last_movement_time: '',
                                  last_count_time: '',
                                  stock_status: '正常'
                                };
                                setCountedSnapshot(mockSnap);
                                setRealCountQty(0);
                                setFlowStep(3);
                              }
                            }}
                            className="py-2.5 px-1 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer text-center"
                          >
                            盘点
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ================= CASE B: LOCATION DETAILS ================= */}
                    {checkedLocation && (
                      <div className="space-y-4">
                        {/* 1. Location master card */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs">
                          <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <MapPin className="w-4.5 h-4.5" />
                            <span className="font-mono font-bold text-xs">物理库位信息 CHECK-BIN</span>
                          </div>
                          <div className="text-xs space-y-1 mt-2">
                            <div>库位编号: <strong className="text-amber-600 font-mono text-sm block">{checkedLocation.location_code}</strong></div>
                            <div>所属仓库: <span className="font-medium text-gray-700">{checkedLocation.warehouse_code === 'RAW-WH' ? 'RAW 原材料仓' : checkedLocation.warehouse_code === 'ACC-WH' ? 'ACC 辅料仓' : 'SAMPLE 样品仓'}</span></div>
                            <div>所属库区: <span className="font-medium text-gray-750 font-mono">{checkedLocation.zone_code} 货架存储区</span></div>
                            <div className="text-[10px] text-gray-400 mt-1">关联条码: {checkedLocation.barcode}</div>
                          </div>
                        </div>

                        {/* 2. Materials list inside this bin */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs space-y-3">
                          <h4 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-1.5 flex justify-between items-center">
                            <span>当前库位内的物料列表 ({snapshots.filter(s => s.location_code === checkedLocation.location_code && s.warehouse_code === currentWarehouseCode).length} 种)</span>
                            <span className="text-[10px] text-gray-400 font-normal">本仓存放</span>
                          </h4>
                          
                          {(() => {
                            const binSnaps = snapshots.filter(s => s.location_code === checkedLocation.location_code && s.warehouse_code === currentWarehouseCode);
                            if (binSnaps.length === 0) {
                              return <p className="text-[11px] text-gray-400 py-4 text-center">当前库位空置中 (无在库实物数据)</p>;
                            }
                            return (
                              <div className="space-y-2">
                                {binSnaps.map(s => (
                                  <div key={s.id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-[11px] space-y-1 font-mono">
                                    <div className="flex justify-between">
                                      <span className="font-bold text-gray-800">{s.material_code}</span>
                                      <span className="font-bold text-gray-700">{s.physical_qty} {s.unit}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-sans truncate">{s.material_name}</div>
                                    <div className="flex justify-between text-[9px] text-gray-400 font-sans mt-1 pt-1 border-t border-gray-200/50">
                                      <span>批次: {s.batch_no}</span>
                                      <span>状态: {s.stock_status}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* 3. Helper Info Box */}
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[10px] leading-relaxed text-amber-800">
                          <span className="font-bold block mb-0.5">⚠️ 实盘说明</span>
                          由于流水集成，此处数量只读。若清点发现实存不一致，请点击下方紫色按钮直接一键发起盘点登记差异。
                        </div>

                        {/* 4. One-click Counting button */}
                        <button
                          onClick={() => {
                            setActiveFlow('count');
                            setSelectedLocation(checkedLocation);
                            setFlowStep(2); // Goes to choose SKU on that location
                          }}
                          className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-800/10 cursor-pointer text-center flex items-center justify-center gap-1.5"
                        >
                          <ClipboardCheck className="w-4 h-4" /> 一键发起该库位盘点
                        </button>

                        {/* Small shortcuts to In / Out to this specific location */}
                        <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold text-gray-700">
                          <button
                            onClick={() => {
                              setActiveFlow('in');
                              setSelectedLocation(checkedLocation);
                              setFlowStep(1); // scan material first
                            }}
                            className="py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl cursor-pointer"
                          >
                            入库至此
                          </button>
                          <button
                            onClick={() => {
                              setActiveFlow('out');
                              setSelectedLocation(checkedLocation);
                              setFlowStep(1); // scan material first
                            }}
                            className="py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl cursor-pointer"
                          >
                            自此出库
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: SCAN LOGS (最近现场流水) */}
            {activeTab === 'logs' && (
              <div className="flex-1 flex flex-col">
                <h3 className="font-bold text-sm text-slate-800 mb-2 flex items-center gap-1">
                  <History className="w-4 h-4 text-emerald-600" />
                  我最近提交的流水 ({workerLogs.length} 条)
                </h3>
                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">流水不可随意修改，由扫码动作完成后自动记录并累加，财务和主管可在电脑管理端穿透审计。</p>
                
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[460px] pr-1">
                  {workerLogs.map(m => (
                    <div key={m.movement_no} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs text-xs">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-semibold text-slate-700">{m.material_code}</span>
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                          m.movement_type.includes('入库') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {m.movement_type}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px] font-medium truncate">{m.material_name}</div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 mt-2 font-mono">
                        <div>变动数量: <strong className={m.quantity_change > 0 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}</strong> {m.unit}</div>
                        <div className="text-right">库位: {m.location_code}</div>
                        <div>流水号: {m.movement_no}</div>
                        <div className="text-right text-[9px] text-slate-400">{m.operation_time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: ME (配置与角色模拟切换) */}
            {activeTab === 'me' && (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 text-center">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full mx-auto flex items-center justify-center text-white text-lg font-bold mb-2">
                    张
                  </div>
                  <h4 className="font-bold text-slate-800">张仓管 (Warehouse Staff)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">工号: WS-04192 | 部门: 仓储部现场组</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">模拟当前工作所在的物理仓库</label>
                    <div className="grid grid-cols-3 gap-2">
                      {warehouses.map(w => (
                        <button
                          key={w.warehouse_code}
                          onClick={() => setCurrentWarehouseCode(w.warehouse_code)}
                          className={`py-2 px-1 text-center rounded-lg text-xs font-semibold border transition-all ${
                            currentWarehouseCode === w.warehouse_code
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {w.warehouse_name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">测试其他角色 (在电脑端可看到完全不同的视角)</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['Warehouse Staff', 'Warehouse Manager', 'Admin', 'Finance'].map(role => (
                        <button
                          key={role}
                          onClick={() => setCurrentUserRole(role as UserRole)}
                          className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                            currentUserRole === role
                              ? 'bg-slate-850 text-white border-slate-800'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{role === 'Warehouse Staff' ? '仓库员工' : role === 'Warehouse Manager' ? '仓库主管' : role === 'Admin' ? '系统管理员' : '财务专员'}</span>
                          {currentUserRole === role && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-[11px] leading-relaxed text-emerald-800">
                    <span className="font-bold block mb-0.5">💡 高拟真模拟优势</span> WMS 实物数量、流水表和异常预警状态均由这三个核心扫码业务全权驱动。您在此处录入的任何变动，都会通过 React 全局 context 实时应用，切回电脑端可立刻观测到库存曲线和警报消除！
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ======================================================== */
          /* WIZARD FLOWS */
          /* ======================================================== */
          <div className="flex-1 flex flex-col justify-between">
            
            {/* Header of Wizard */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-3">
              <button
                onClick={resetFlow}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium py-1 px-2 hover:bg-slate-200/50 rounded-lg transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> 返回首页
              </button>
              <span className="text-xs font-bold text-slate-500">
                {activeFlow === 'in' ? '采购/退料入库向导' : activeFlow === 'out' ? '部门领用出库向导' : '库位物料实盘向导'}
              </span>
            </div>

            {/* ==================== 1. IN-FLOW ==================== */}
            {activeFlow === 'in' && (
              <div className="flex-1 flex flex-col justify-between">
                {/* Step 1: Scan Material QR */}
                {flowStep === 1 && (
                  <div className="space-y-4 py-2 flex-1 flex flex-col justify-center">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                        <QrCode className="w-8 h-8 animate-pulse" />
                      </div>
                      <h4 className="font-bold text-base">扫描物料外箱二维码</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        请扫描物料包装上的标签贴码。系统会自动解析对应的物料规格、颜色和默认供应商，无需手动搜索输入。
                      </p>
                    </div>

                    <button
                      onClick={() => startScanning('material', (val) => {
                        const mat = materials.find(m => m.material_code === val);
                        if (mat) {
                          setSelectedMaterial(mat);
                          setFlowStep(2);
                        } else {
                          alert(`未在物料主数据中找到条码: ${val}，可在预设中点击进行选择`);
                        }
                      })}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm cursor-pointer"
                    >
                      <Scan className="w-4 h-4" /> 开启模拟摄像头扫码
                    </button>
                  </div>
                )}

                {/* Step 2: Select Stock-In Type */}
                {flowStep === 2 && selectedMaterial && (
                  <div className="space-y-4 flex-1">
                    <div className="bg-slate-100 rounded-xl p-3 flex gap-3 border border-slate-200">
                      <img src={selectedMaterial.image} className="w-12 h-12 rounded-lg object-cover bg-white" alt="img" />
                      <div className="text-xs">
                        <span className="font-bold block text-slate-800">{selectedMaterial.material_code}</span>
                        <span className="text-slate-600 block mt-0.5">{selectedMaterial.material_name}</span>
                        <span className="text-slate-400 font-mono text-[10px]">规格: {selectedMaterial.specification} | 颜色: {selectedMaterial.color}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">点选本次入库类型</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {['采购入库', '生产退料', '盘盈入库', '其他入库'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setInType(type as any)}
                            className={`p-3 text-center rounded-xl font-semibold border transition-all ${
                              inType === type
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">物理批次号选择/扫码 (默认系统预配)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={selectedBatch}
                          onChange={(e) => setSelectedBatch(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 text-xs font-mono rounded-lg px-3 py-2"
                        />
                        <button
                          onClick={() => startScanning('batch', (val) => setSelectedBatch(val))}
                          className="bg-slate-200 hover:bg-slate-300 transition-colors px-3 rounded-lg text-xs"
                        >
                          扫批次码
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setFlowStep(3)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl mt-4 text-xs cursor-pointer"
                    >
                      下一步：扫描库位
                    </button>
                  </div>
                )}

                {/* Step 3: Select Location Bins */}
                {flowStep === 3 && selectedMaterial && (
                  <div className="space-y-4 flex-1">
                    <div className="text-center space-y-1">
                      <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
                        <MapPin className="w-6 h-6 animate-bounce" />
                      </div>
                      <h4 className="font-bold text-sm">扫描存放目的库位二维码</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">请扫描货架上的通道-排-架-位四级定位码</p>
                    </div>

                    <button
                      onClick={() => startScanning('location', (val) => {
                        const loc = locations.find(l => l.location_code === val);
                        if (loc) {
                          setSelectedLocation(loc);
                          setFlowStep(4);
                        } else {
                          alert(`未找到注册库位: ${val}`);
                        }
                      })}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer"
                    >
                      <Scan className="w-4 h-4" /> 扫描物理货位二维码
                    </button>

                    <div className="mt-4">
                      <span className="block text-xs font-bold text-slate-500 mb-1.5">或从该仓库中直接点选推荐库位：</span>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {locations.filter(l => l.warehouse_code === currentWarehouseCode).map(l => (
                          <button
                            key={l.location_code}
                            onClick={() => {
                              setSelectedLocation(l);
                              setFlowStep(4);
                            }}
                            className="p-2 text-left bg-white hover:bg-emerald-50/50 border border-slate-200 rounded-lg text-[11px] font-mono hover:border-emerald-500"
                          >
                            <span className="font-bold text-slate-700 block">{l.location_code}</span>
                            <span className="text-[9px] text-slate-400 truncate block">{l.location_name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Input Quantity */}
                {flowStep === 4 && selectedMaterial && selectedLocation && (
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="bg-slate-100 rounded-xl p-3 text-xs flex justify-between items-center border border-slate-200">
                        <div>
                          <span className="font-bold block text-slate-800">{selectedMaterial.material_name}</span>
                          <span className="text-slate-500 font-mono text-[10px]">物理库位: {selectedLocation.location_code} | 批次: {selectedBatch}</span>
                        </div>
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-sm text-[10px]">
                          类型: {inType}
                        </span>
                      </div>

                      <div className="text-center py-4 bg-white border border-slate-200 rounded-2xl p-4">
                        <label className="block text-xs font-bold text-slate-500 mb-2">输入实际清点入库数量 ({selectedMaterial.unit})</label>
                        
                        {/* Huge quantity display */}
                        <div className="flex justify-center items-center gap-6 my-2">
                          <button 
                            onClick={() => adjustQty(-1)}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)} step="0.01"
                            className="w-24 text-3xl font-black text-slate-800 text-center border-b-2 border-slate-300 focus:border-emerald-500 focus:outline-none"
                          />

                          <button 
                            onClick={() => adjustQty(1)}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Quick modifiers (+10, +100) */}
                        <div className="flex justify-center gap-1.5 mt-4">
                          {[-10, +10, +100].map(val => (
                            <button
                              key={val}
                              onClick={() => adjustQty(val)}
                              className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors"
                            >
                              {val > 0 ? `+${val}` : val}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500">作业备注说明 (选填)</label>
                        <input
                          type="text"
                          value={remark}
                          onChange={(e) => setRemark(e.target.value)}
                          placeholder="例如: 完好无损、托盘绑定"
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleStockInSubmit}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl mt-4 text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-800/20"
                    >
                      <CheckCircle2 className="w-4 h-4" /> 确认提交入库流水
                    </button>
                  </div>
                )}

                {/* Step 5: Success Results */}
                {flowStep === 5 && successResult && (
                  <div className="flex-1 flex flex-col justify-between py-2 text-center">
                    <div className="space-y-4 my-auto">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">入库作业登记成功</h3>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                        数据已实时上报，自动生成单据，库房实物库存表已完成汇总更新。
                      </p>

                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-left text-xs max-w-xs mx-auto space-y-2 font-mono">
                        <div className="flex justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-slate-400">流水凭证号:</span>
                          <span className="font-bold text-slate-800">{successResult.movementNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">入库物料:</span>
                          <span className="font-bold text-slate-800 text-right">{successResult.materialName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">存放库位:</span>
                          <span className="font-bold text-amber-600">{successResult.locationCode}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1.5 font-sans">
                          <span className="text-slate-400">实物数变动:</span>
                          <span className="font-bold text-emerald-600">
                            {successResult.prevQty} → {successResult.newQty} ({successResult.changeQty > 0 ? `+${successResult.changeQty}` : successResult.changeQty})
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={resetFlow}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl mt-6 text-xs cursor-pointer"
                    >
                      回到首页继续作业
                    </button>
                  </div>
                )}
              </div>
            )}


            {/* ==================== 2. OUT-FLOW ==================== */}
            {activeFlow === 'out' && (
              <div className="flex-1 flex flex-col justify-between">
                {/* Step 1: Scan Material QR */}
                {flowStep === 1 && (
                  <div className="space-y-4 py-2 flex-1 flex flex-col justify-center">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto text-sky-600">
                        <QrCode className="w-8 h-8 animate-pulse" />
                      </div>
                      <h4 className="font-bold text-base">扫描出库物料二维码</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        系统在扫码后会自动带出该物料在当前仓库所有货架上的实物库存、预留锁定数，并自动匹配库位。
                      </p>
                    </div>

                    <button
                      onClick={() => startScanning('material', (val) => {
                        const mat = materials.find(m => m.material_code === val);
                        if (mat) {
                          setSelectedMaterial(mat);
                          // Auto match a snapshot bin if exists to simplify employee step
                          const matchedSnap = snapshots.find(s => s.material_code === val && s.warehouse_code === currentWarehouseCode && s.physical_qty > 0);
                          if (matchedSnap) {
                            const matchedLoc = locations.find(l => l.location_code === matchedSnap.location_code);
                            if (matchedLoc) setSelectedLocation(matchedLoc);
                          } else {
                            // Default to first location in warehouse
                            const defaultLoc = locations.find(l => l.warehouse_code === currentWarehouseCode);
                            if (defaultLoc) setSelectedLocation(defaultLoc);
                          }
                          setFlowStep(2);
                        } else {
                          alert(`未在物料主数据中找到条码: ${val}`);
                        }
                      })}
                      className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm cursor-pointer"
                    >
                      <Scan className="w-4 h-4" /> 开启模拟摄像头扫码
                    </button>
                  </div>
                )}

                {/* Step 2: Select Out-Type & Dept */}
                {flowStep === 2 && selectedMaterial && (
                  <div className="space-y-4 flex-1">
                    <div className="bg-slate-100 rounded-xl p-3 text-xs border border-slate-200">
                      <span className="font-bold block text-slate-800">{selectedMaterial.material_code}</span>
                      <span className="text-slate-600 block mt-0.5">{selectedMaterial.material_name}</span>
                      
                      {/* Check current available in warehouse */}
                      {(() => {
                        const snapInWh = snapshots.filter(s => s.material_code === selectedMaterial.material_code && s.warehouse_code === currentWarehouseCode);
                        const totalAvail = snapInWh.reduce((sum, s) => sum + s.available_qty, 0);
                        const totalPhys = snapInWh.reduce((sum, s) => sum + s.physical_qty, 0);
                        
                        return (
                          <div className="mt-2 flex gap-3 text-[10px] bg-sky-50 text-sky-800 p-2 rounded-md font-mono font-semibold">
                            <span>仓库实物: {totalPhys} {selectedMaterial.unit}</span>
                            <span>可用配给: {totalAvail} {selectedMaterial.unit}</span>
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">点选出库类别</label>
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        {['生产领料', '样品领料', '报废出库', '盘亏出库', '其他出库'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setOutType(type as any)}
                            className={`p-2 text-center rounded-lg font-bold border transition-all ${
                              outType === type
                                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">领用用途或车间部门</label>
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        {['裁床', '车缝', '包装', '研发样品仓', '外发', '其他'].map((dept) => (
                          <button
                            key={dept}
                            onClick={() => setOutDepartment(dept)}
                            className={`p-2 text-center rounded-lg font-bold border transition-all ${
                              outDepartment === dept
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Choose location of source */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">出库来源货架库位</label>
                      <select
                        value={selectedLocation?.location_code || ''}
                        onChange={(e) => {
                          const loc = locations.find(l => l.location_code === e.target.value);
                          if (loc) setSelectedLocation(loc);
                        }}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                      >
                        {locations.filter(l => l.warehouse_code === currentWarehouseCode).map(l => {
                          const snapForLoc = snapshots.find(s => s.material_code === selectedMaterial.material_code && s.location_code === l.location_code);
                          const qty = snapForLoc ? snapForLoc.physical_qty : 0;
                          return (
                            <option key={l.location_code} value={l.location_code}>
                              {l.location_code} ({l.location_name}) - 余: {qty} {selectedMaterial.unit}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        setFlowError('');
                        setFlowStep(3);
                      }}
                      className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl mt-2 text-xs cursor-pointer"
                    >
                      下一步：输入出库数量
                    </button>
                  </div>
                )}

                {/* Step 3: Out Qty & Validate */}
                {flowStep === 3 && selectedMaterial && selectedLocation && (
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      {(() => {
                        // Get stock in this bin
                        const snapItem = snapshots.find(s => s.material_code === selectedMaterial.material_code && s.location_code === selectedLocation.location_code && s.warehouse_code === currentWarehouseCode);
                        const availableQty = snapItem ? snapItem.available_qty : 0;
                        const gap = Number(quantity) - availableQty;
                        const isOver = gap > 0;

                        return (
                          <>
                            <div className="bg-slate-100 rounded-xl p-3 text-xs border border-slate-200">
                              <span className="font-bold text-slate-800 block">{selectedMaterial.material_name}</span>
                              <div className="flex justify-between mt-2 font-mono text-[10px] font-semibold text-slate-500">
                                <span>出库货位: {selectedLocation.location_code}</span>
                                <span>可用库存: <strong className="text-sky-600">{availableQty}</strong> {selectedMaterial.unit}</span>
                              </div>
                            </div>

                            <div className="text-center py-4 bg-white border border-slate-200 rounded-2xl p-4">
                              <label className="block text-xs font-bold text-slate-500 mb-2">输入实际领出数量 ({selectedMaterial.unit})</label>
                              
                              <div className="flex justify-center items-center gap-6 my-2">
                                <button 
                                  onClick={() => adjustQty(-1)}
                                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                                >
                                  <Minus className="w-5 h-5" />
                                </button>
                                
                                <input
                                  type="number"
                                  value={quantity}
                                  onChange={(e) => setQuantity(e.target.value)} step="0.01"
                                  className="w-24 text-3xl font-black text-slate-800 text-center border-b-2 border-slate-300 focus:border-sky-500 focus:outline-none"
                                />

                                <button 
                                  onClick={() => adjustQty(1)}
                                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </div>

                              <div className="flex justify-center gap-1.5 mt-4">
                                {[-10, +10, +100].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => adjustQty(val)}
                                    className="px-3 py-1 bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors"
                                  >
                                    {val > 0 ? `+${val}` : val}
                                  </button>
                                ))}
                              </div>

                              <div className="text-[11px] text-slate-400 mt-3 font-mono">
                                本次出库后预计剩余库存: <strong className={isOver ? 'text-red-500 font-bold' : 'text-slate-600 font-bold'}>{isOver ? 0 : availableQty - Number(quantity)}</strong> {selectedMaterial.unit}
                              </div>
                            </div>

                            {/* Strict Requirement Validation Warnings */}
                            {isOver ? (
                              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 space-y-2">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold">🚨 警告：可用实物库存不足！</span>
                                    <p className="text-[11px] text-red-700 mt-1 leading-relaxed">
                                      当前可用库存 <strong>{availableQty}</strong>，本次申请出库 <strong>{quantity}</strong>，<strong>缺口为 {gap} {selectedMaterial.unit}</strong>。
                                    </p>
                                    <p className="text-[11px] text-red-600 mt-1">WMS已在预警表中生成「负库存风险」记录，系统已默认锁死出库。</p>
                                  </div>
                                </div>
                                
                                <div className="border-t border-red-100 pt-2 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStockOutSubmit(true)}
                                    className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs"
                                  >
                                    主管现场解锁特批出库 (Force Bypass)
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-500">出库备注/领用单号 (选填)</label>
                                <input
                                  type="text"
                                  value={remark}
                                  onChange={(e) => setRemark(e.target.value)}
                                  placeholder="例如: 拼单领料、加急样品"
                                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                                />
                              </div>
                            )}

                            {!isOver && (
                              <button
                                onClick={() => handleStockOutSubmit(false)}
                                className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl mt-2 text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-sky-800/10"
                              >
                                <CheckCircle2 className="w-4 h-4" /> 确认扣减出库
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Step 4: Success View */}
                {flowStep === 4 && successResult && (
                  <div className="flex-1 flex flex-col justify-between py-2 text-center">
                    <div className="space-y-4 my-auto">
                      <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto text-sky-600">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 font-sans">出库作业成功</h3>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                        出库流水已落库。若物料剩余库存低于安全储备限额，系统已自动生成低库存预警提醒采购跟进。
                      </p>

                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-left text-xs max-w-xs mx-auto space-y-2 font-mono">
                        <div className="flex justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-slate-400">流水凭证号:</span>
                          <span className="font-bold text-slate-800">{successResult.movementNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">出库物料:</span>
                          <span className="font-bold text-slate-800 text-right">{successResult.materialName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">出库库位:</span>
                          <span className="font-bold text-amber-600">{successResult.locationCode}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1.5 font-sans">
                          <span className="text-slate-400">实物数变动:</span>
                          <span className="font-bold text-sky-600">
                            {successResult.prevQty} → {successResult.newQty} ({successResult.changeQty})
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={resetFlow}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl mt-6 text-xs cursor-pointer"
                    >
                      回到首页继续作业
                    </button>
                  </div>
                )}
              </div>
            )}


            {/* ==================== 3. COUNT-FLOW ==================== */}
            {activeFlow === 'count' && (
              <div className="flex-1 flex flex-col justify-between">
                
                {/* Step 1: Scan Material or Location QR */}
                {flowStep === 1 && (
                  <div className="space-y-4 py-2 flex-1 flex flex-col justify-center">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto text-purple-600">
                        <Scan className="w-8 h-8 animate-pulse" />
                      </div>
                      <h4 className="font-bold text-base">扫描需要盘点的物料或库位</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        支持扫描货架「库位码」或直接扫描「物料二维码」。扫码后系统会展示当前库位在数据库中记录的账面库存。
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => startScanning('material', (val) => {
                          // Find snapshots for this material code
                          const snapItems = snapshots.filter(s => s.material_code === val && s.warehouse_code === currentWarehouseCode);
                          if (snapItems.length > 0) {
                            setCountedSnapshot(snapItems[0]);
                            setRealCountQty(snapItems[0].physical_qty);
                            setFlowStep(3); // Go to input
                          } else {
                            // Find material
                            const mat = materials.find(m => m.material_code === val);
                            if (mat) {
                              // Create mock snapshot template with 0 qty
                              const mockSnap: InventorySnapshot = {
                                id: `${val}|${currentWarehouseCode}|A01-01-01|BATCH-2026-0610`,
                                material_code: val,
                                material_name: mat.material_name,
                                category: mat.category,
                                specification: mat.specification,
                                color: mat.color,
                                batch_no: 'BATCH-2026-0610',
                                warehouse_code: currentWarehouseCode,
                                warehouse_name: getWarehouseName(currentWarehouseCode),
                                location_code: 'A01-01-01',
                                location_name: getLocationName('A01-01-01'),
                                physical_qty: 0,
                                available_qty: 0,
                                reserved_qty: 0,
                                locked_qty: 0,
                                unit: mat.unit,
                                last_movement_time: '',
                                last_count_time: '',
                                stock_status: '正常'
                              };
                              setCountedSnapshot(mockSnap);
                              setRealCountQty(0);
                              setFlowStep(3);
                            } else {
                              alert(`找不到物料: ${val}`);
                            }
                          }
                        })}
                        className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" /> 扫描物料标签二维码
                      </button>

                      <button
                        onClick={() => startScanning('location', (val) => {
                          const snapItems = snapshots.filter(s => s.location_code === val && s.warehouse_code === currentWarehouseCode);
                          if (snapItems.length > 0) {
                            // Go to step 2 to choose which SKU on this bin to count
                            setSelectedLocation(locations.find(l => l.location_code === val) || null);
                            setFlowStep(2);
                          } else {
                            alert(`该库位 (${val}) 当前没有账面库存，但在PC端可以添加。`);
                          }
                        })}
                        className="w-full py-3 bg-slate-850 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer"
                      >
                        <MapPin className="w-4 h-4" /> 扫描物理库位码盘点
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Choose which SKU on bin to count (if location scan was selected) */}
                {flowStep === 2 && selectedLocation && (
                  <div className="space-y-4 flex-1">
                    <h4 className="text-xs font-bold text-slate-500">
                      库位: <strong className="text-slate-800">{selectedLocation.location_code}</strong> 当前存货列表
                    </h4>
                    <p className="text-[11px] text-slate-400">请点选要核对的 SKU 物料：</p>

                    <div className="space-y-2 max-h-[280px] overflow-y-auto">
                      {snapshots.filter(s => s.location_code === selectedLocation.location_code && s.warehouse_code === currentWarehouseCode).map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setCountedSnapshot(s);
                            setRealCountQty(s.physical_qty);
                            setFlowStep(3);
                          }}
                          className="w-full p-3 bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-500 rounded-xl text-left text-xs transition-all flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold text-slate-800 block">{s.material_code}</span>
                            <span className="text-slate-600 block mt-0.5">{s.material_name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">批次: {s.batch_no}</span>
                          </div>
                          <div className="text-right">
                            <span className="block font-bold text-slate-700">{s.physical_qty} {s.unit}</span>
                            <span className="text-[9px] text-slate-400">账面存数</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Input Real counted stock */}
                {flowStep === 3 && countedSnapshot && (
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Book info card */}
                      <div className="bg-slate-100 rounded-xl p-3 text-xs border border-slate-200">
                        <span className="font-bold text-slate-800 block">{countedSnapshot.material_name}</span>
                        <div className="flex justify-between mt-2 font-mono text-[10px] font-semibold text-slate-500">
                          <span>库位: {countedSnapshot.location_code}</span>
                          <span>账面库存: <strong className="text-purple-700">{countedSnapshot.physical_qty}</strong> {countedSnapshot.unit}</span>
                        </div>
                      </div>

                      {/* Real count section */}
                      <div className="text-center py-4 bg-white border border-slate-200 rounded-2xl p-4">
                        <label className="block text-xs font-bold text-slate-500 mb-2">输入本次「实盘」数量 ({countedSnapshot.unit})</label>
                        
                        <div className="flex justify-center items-center gap-6 my-2">
                          <button 
                            onClick={() => adjustRealCountQty(-1)}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          
                          <input
                            type="number"
                            value={realCountQty}
                            onChange={(e) => setRealCountQty(e.target.value)} step="0.01"
                            className="w-24 text-3xl font-black text-slate-800 text-center border-b-2 border-slate-300 focus:border-purple-500 focus:outline-none"
                          />

                          <button 
                            onClick={() => adjustRealCountQty(1)}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Quick increment / Same value shortcut */}
                        <div className="flex justify-center gap-1.5 mt-4">
                          <button
                            onClick={() => setRealCountQty(countedSnapshot.physical_qty)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 transition-colors"
                          >
                            数量一致 (一键实盘)
                          </button>
                          {[-10, +10, +100].map(val => (
                            <button
                              key={val}
                              onClick={() => adjustRealCountQty(val)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 transition-colors"
                            >
                              {val > 0 ? `+${val}` : val}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Display difference instantly */}
                      {(() => {
                        const diff = Number(realCountQty) - countedSnapshot.physical_qty;
                        if (diff !== 0) {
                          return (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-2">
                              <div className="flex items-start gap-1.5 text-amber-800">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">⚠️ 盘点结果存在差异！</span>
                                  <p className="text-[10px] text-amber-700 mt-0.5">
                                    实盘数量与账面数量不符（差异：<strong className={diff > 0 ? 'text-emerald-600' : 'text-red-600'}>{diff > 0 ? `+${diff}` : diff}</strong> {countedSnapshot.unit}）。
                                  </p>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">请选择产生盘点差异的主要原因：</label>
                                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                                  {['少料', '多料', '库位错误', '单位错误', '上次漏扫', '其他'].map(r => (
                                    <button
                                      key={r}
                                      onClick={() => setCountReason(r)}
                                      className={`p-1.5 text-center rounded-md border font-semibold transition-all ${
                                        countReason === r
                                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                      }`}
                                    >
                                      {r}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span className="font-semibold">实盘账面一致！无需备注，可直接提交。</span>
                            </div>
                          );
                        }
                      })()}
                    </div>

                    <button
                      onClick={handlePhysicalCountSubmit}
                      className="w-full py-3.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl mt-4 text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/15"
                    >
                      <CheckCircle2 className="w-4 h-4" /> 确认盘点结果
                    </button>
                  </div>
                )}

                {/* Step 5: Success Count Card */}
                {flowStep === 5 && successResult && (
                  <div className="flex-1 flex flex-col justify-between py-2 text-center">
                    <div className="space-y-4 my-auto">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto text-purple-600">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 font-sans">
                        {successResult.changeQty === 0 ? '盘点完成 (无差异)' : '盘点差异已登账'}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                        {successResult.changeQty === 0 
                          ? '物料盘点比对通过，账面数据完全相符，系统已自动重置该 SKU 的最近盘点更新时间。' 
                          : '盘点大差异已提交。系统已生成特批冲正记录并通知质检、财务审查核实。'
                        }
                      </p>

                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-left text-xs max-w-xs mx-auto space-y-2 font-mono">
                        <div className="flex justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-slate-400">单据凭证号:</span>
                          <span className="font-bold text-slate-800">{successResult.movementNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">盘点物料:</span>
                          <span className="font-bold text-slate-800 text-right">{successResult.materialName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">物理货位:</span>
                          <span className="font-bold text-amber-600">{successResult.locationCode}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1.5 font-sans">
                          <span className="text-slate-400">差异核查:</span>
                          <span className="font-bold text-slate-800">
                            账面 {successResult.prevQty} → 实盘 {successResult.newQty} (
                            <strong className={successResult.changeQty === 0 ? 'text-emerald-600' : 'text-red-500'}>
                              {successResult.changeQty > 0 ? `+${successResult.changeQty}` : successResult.changeQty}
                            </strong>)
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={resetFlow}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl mt-6 text-xs cursor-pointer"
                    >
                      回到首页继续作业
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>
        )}
      </div>

      {/* Simplified Mobile Bottom Tab Navigation */}
      {activeFlow === null && (
        <div className="bg-white border-t border-slate-200 grid grid-cols-3 text-center py-2 text-slate-500 select-none shadow-sm font-medium">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 py-1 transition-colors cursor-pointer ${
              activeTab === 'home' || activeTab === 'check_stock' ? 'text-emerald-600' : 'hover:text-slate-800'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">首页</span>
          </button>
          
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center gap-0.5 py-1 transition-colors cursor-pointer ${
              activeTab === 'logs' ? 'text-emerald-600' : 'hover:text-slate-800'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px]">记录</span>
          </button>
          
          <button
            onClick={() => setActiveTab('me')}
            className={`flex flex-col items-center gap-0.5 py-1 transition-colors cursor-pointer ${
              activeTab === 'me' ? 'text-emerald-600' : 'hover:text-slate-800'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">我的</span>
          </button>
        </div>
      )}

      {/* Connected Scan Simulator */}
      <ScanSimulator
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={scanCallback}
        expectedType={scanExpectedType}
        materialsList={materials}
        locationsList={locations}
        documentsList={[]}
      />
    </div>
  );
}
