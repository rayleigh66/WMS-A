/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWms } from '../context/WmsContext';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  Database, 
  AlertOctagon, 
  History, 
  FileCheck, 
  BarChart3, 
  Cpu, 
  Settings, 
  Search, 
  Filter, 
  SlidersHorizontal,
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  CheckCircle, 
  UserCheck, 
  FileSpreadsheet, 
  Clock, 
  MapPin, 
  Layers,
  ArrowRightLeft,
  Calendar,
  DollarSign,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Save,
  Check,
  X,
  HelpCircle
} from 'lucide-react';
import { Material, InventorySnapshot, StockMovement, MaterialAlert, WmsDocument } from '../types';

export default function DesktopApp() {
  const {
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
    addNewMaterial,
    addNewLocation,
    auditDocument,
    resolveAlert,
    addStockIn
  } = useWms();

  // Selected menu tab in PC view
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'materials' | 'snapshots' | 'inbound' | 'outbound' | 'counting' | 'ledger' | 'alerts' | 'reports' | 'integration' | 'settings'>('dashboard');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [alertTypeFilter, setAlertTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Material for detailing
  const [selectedMatCode, setSelectedMatCode] = useState<string | null>(null);

  // New location/material creation modals in PC basic settings
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [newLocCode, setNewLocCode] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocWh, setNewLocWh] = useState('RAW-WH');

  // Computed values
  const totalSkus = materials.length;
  const totalPhysicalQty = snapshots.reduce((sum, s) => sum + s.physical_qty, 0);
  
  // Simulated stock value (each material gets a mock price)
  const getMockPrice = (cat: string) => {
    switch (cat) {
      case '面料': return 45;
      case '拉链': return 12;
      case '五金': return 25;
      case '扣具': return 1.5;
      case '拉头': return 0.8;
      case '里布': return 18;
      case '辅料': return 35;
      case '包装': return 4.5;
      default: return 10;
    }
  };

  const totalValueValuation = snapshots.reduce((sum, s) => {
    const matPrice = getMockPrice(s.category);
    return sum + (s.physical_qty * matPrice);
  }, 0);

  const activeAlertsCount = alerts.filter(a => a.status !== '已处理').length;
  const pendingAuditsCount = documents.filter(d => d.status === '待审核').length;
  const todayInboundCount = movements.filter(m => m.movement_type.includes('入库') && m.operation_time.includes('2026-07-03')).reduce((sum, m) => sum + m.quantity_change, 0);
  const todayOutboundCount = movements.filter(m => m.movement_type.includes('出料') || m.movement_type.includes('领料') && m.operation_time.includes('2026-07-03')).reduce((sum, m) => sum + Math.abs(m.quantity_change), 0);

  // Sub-groups of material counts
  const oosCount = snapshots.filter(s => s.physical_qty <= 0).length;
  const lowStockCount = alerts.filter(a => a.alert_type === '低库存' && a.status !== '已处理').length;

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocCode.trim() || !newLocName.trim()) return;
    addNewLocation({
      location_code: newLocCode.trim().toUpperCase(),
      location_name: newLocName.trim(),
      warehouse_code: newLocWh,
      zone_code: 'ZONE-B',
      status: '启用',
      barcode: `LOC-${newLocWh}-${newLocCode.trim().replace(/-/g, '')}`
    });
    setNewLocCode('');
    setNewLocName('');
    setShowAddLoc(false);
  };

  // Helper colors for Severity badges
  const getSeverityStyles = (sev: string) => {
    switch (sev) {
      case '高': return 'bg-red-50 text-red-700 border-red-200';
      case '中': return 'bg-amber-50 text-amber-700 border-amber-200';
      case '低': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Helper colors for Document Status badges
  const getDocStatusStyles = (status: string) => {
    switch (status) {
      case '已完成': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case '待审核': return 'bg-blue-50 text-blue-700 border-blue-200';
      case '草稿': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="flex-1 flex bg-white/95 min-h-[700px] text-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 font-sans backdrop-blur-xl">
      
      {/* 1. Side Navigation Menu */}
      <div className="w-64 bg-gray-50/80 border-r border-gray-200/60 flex flex-col justify-between py-6 backdrop-blur-md z-10">
        <div>
          {/* Logo Brand */}
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md ring-1 ring-gray-900/10">
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-emerald-400 to-teal-200 text-lg">W</span>
            </div>
            <div>
              <span className="block font-black text-sm text-gray-800 tracking-wider">FACTORY WMS</span>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">背包工厂独立仓管</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5 px-3">
            {[
              { id: 'dashboard', label: '控制中心', icon: LayoutDashboard },
              { id: 'materials', label: '物料主数据', icon: Package },
              { id: 'snapshots', label: '实时库存', icon: Warehouse },
              { id: 'inbound', label: '入库管理', icon: ArrowDownLeft, badge: documents.filter(d => d.document_type === '入库单' && d.status === '待审核').length },
              { id: 'outbound', label: '出库管理', icon: ArrowUpRight },
              { id: 'counting', label: '盘点管理', icon: FileCheck, badge: documents.filter(d => d.document_type === '盘点单' && d.status === '待审核').length },
              { id: 'ledger', label: '出入库流水', icon: History },
              { id: 'alerts', label: '物料预警表', icon: AlertOctagon, badge: activeAlertsCount },
              { id: 'reports', label: '报表中心', icon: BarChart3 },
              { id: 'settings', label: '系统设置 / 集成', icon: Settings },
            ].map(item => {
              const Icon = item.icon;
              const active = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveMenu(item.id as any);
                    setSelectedMatCode(null);
                  }}
                  className={`group w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer whitespace-nowrap overflow-hidden ${
                    active 
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/20 translate-x-1 ring-1 ring-emerald-500/50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm hover:translate-x-0.5 border border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors duration-300 ${active ? 'text-white' : 'text-gray-400 group-hover:text-emerald-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border shrink-0 transition-colors ${
                      active ? 'bg-white/20 text-white border-white/30' : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Role Switcher at Bottom of Sidebar */}
        <div className="px-4 border-t border-gray-200 pt-4">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">当前登录模拟</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200">
                {currentUserRole[0]}
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-700">{currentUserRole === 'Admin' ? '超级管理员' : currentUserRole === 'Warehouse Manager' ? '仓库主管' : currentUserRole === 'Finance' ? '财务核算' : '计划/采购员'}</span>
                <select
                  value={currentUserRole}
                  onChange={(e) => setCurrentUserRole(e.target.value as any)}
                  className="bg-gray-50 text-[10px] text-gray-600 font-medium py-0.5 px-1.5 mt-0.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Admin">管理员 (Admin)</option>
                  <option value="Warehouse Manager">仓库主管 (Manager)</option>
                  <option value="Warehouse Staff">现场仓管 (Staff)</option>
                  <option value="Purchaser">采购专员 (Purchaser)</option>
                  <option value="PMC">生产计划 (PMC)</option>
                  <option value="Finance">财务审计 (Finance)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Main Content Board */}
      <div className="flex-1 bg-gray-50/30 p-6 flex flex-col overflow-y-auto max-h-[850px]">
        
        {/* Top bar */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-800 flex items-center gap-2">
              {activeMenu === 'dashboard' && '控制中心 Dashboard'}
              {activeMenu === 'materials' && '物料主数据 Materials'}
              {activeMenu === 'snapshots' && '实时库存'}
              {activeMenu === 'inbound' && '入库单管理 Inbound Orders'}
              {activeMenu === 'outbound' && '出库单管理 Outbound Orders'}
              {activeMenu === 'counting' && '盘点差异管理 Stock Counting'}
              {activeMenu === 'ledger' && '出入库流水日志 Ledger'}
              {activeMenu === 'alerts' && '物料异常预警中心 Alerts'}
              {activeMenu === 'reports' && '统计报表中心 Analytics'}
              {activeMenu === 'settings' && '系统设置 / 集成配置'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {activeMenu === 'dashboard' && '实时汇总工厂实物流水，自动化核对各工段安全阈值'}
              {activeMenu === 'materials' && '注册、查询、编辑拉链/织带/拉头/面料/辅料基础档案'}
              {activeMenu === 'snapshots' && '由流水账自动生成的实时存货快照，保证系统账面和实物严格吻合'}
              {activeMenu === 'inbound' && '管理采购到货卸货和现场扫码单据，支持主管一键审批登账'}
              {activeMenu === 'outbound' && '车间工段领用出料审核，结合预先缺口计算拦截恶意超发风险'}
              {activeMenu === 'counting' && '月末及定期物理盘点实录比对，支持差异流水微调对账'}
              {activeMenu === 'ledger' && '不可删除的库存异动流转明细账，为财务提供穿透式追溯'}
              {activeMenu === 'alerts' && '缺货、安全警戒线触发、盘点大差异、负库存风险一网打尽'}
              {activeMenu === 'reports' && '图形化呈现原材料库位饱和度，物料最快消耗排序列报'}
              {activeMenu === 'settings' && '维护仓库分区、添加或启用货区架位，配置扫码枪匹配条码规则及系统集成'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick search input */}
            {['materials', 'snapshots', 'ledger'].includes(activeMenu) && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索物料/流水/规格..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-emerald-500 w-48 transition-all"
                />
              </div>
            )}

            {/* Warehouse switcher */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-semibold text-gray-700 shadow-sm">
              <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-gray-400">管理校准：</span>
              <select
                value={currentWarehouseCode}
                onChange={(e) => setCurrentWarehouseCode(e.target.value)}
                className="bg-transparent text-gray-700 focus:outline-none cursor-pointer"
              >
                {warehouses.map(w => (
                  <option key={w.warehouse_code} value={w.warehouse_code} className="bg-white text-gray-800">
                    {w.warehouse_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW: DASHBOARD */}
        {/* ======================================================== */}
        {activeMenu === 'dashboard' && (
          <div className="space-y-6">
            
            {/* 1. Statistics Cards */}
            <div className="grid grid-cols-4 gap-4">
              
              <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center shadow-sm group">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shadow-sm shrink-0 mr-3 transition-transform group-hover:scale-105">
                  <Package className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate block">物料主数据</span>
                    <HelpCircle className="w-3 h-3 text-gray-300 hover:text-gray-500 cursor-help shrink-0" title="系统中已注册的面料、拉链等各类物料SKU总数" />
                  </div>
                  <span className="text-xl font-extrabold text-gray-800 tracking-tight block mt-0.5 truncate">{totalSkus}</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center shadow-sm group">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shadow-sm shrink-0 mr-3 transition-transform group-hover:scale-105">
                  <RefreshCw className="w-5 h-5 animate-spin-slow" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate block">仓库总库存</span>
                    <HelpCircle className="w-3 h-3 text-gray-300 hover:text-gray-500 cursor-help shrink-0" title={`今日入库: +${todayInboundCount} | 出库: -${todayOutboundCount}`} />
                  </div>
                  <span className="text-xl font-extrabold text-gray-800 tracking-tight block mt-0.5 truncate">
                    {totalPhysicalQty.toLocaleString()} <span className="text-[10px] text-gray-400 font-medium">件/米/码</span>
                  </span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center shadow-sm group">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 shadow-sm shrink-0 mr-3 transition-transform group-hover:scale-105">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate block">存货估值</span>
                    <HelpCircle className="w-3 h-3 text-gray-300 hover:text-gray-500 cursor-help shrink-0" title="根据各物料单价及当前库存数量加权计算出的存货总金额" />
                  </div>
                  <span className="text-xl font-extrabold text-amber-600 tracking-tight block mt-0.5 truncate">
                    ¥{totalValueValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center shadow-sm group">
                <div className="p-2.5 bg-red-50 rounded-xl text-red-600 shadow-sm shrink-0 mr-3 transition-transform group-hover:scale-105">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate block">未处理异常</span>
                    <HelpCircle className="w-3 h-3 text-gray-300 hover:text-gray-500 cursor-help shrink-0" title={`低库存警告: ${lowStockCount} | 严重缺货: ${oosCount}`} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-extrabold text-red-600 tracking-tight block truncate">{activeAlertsCount}</span>
                    {activeAlertsCount > 0 && (
                      <span className="text-[9px] text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded border border-red-200 truncate flex-1">
                        待处理
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* 2. Custom pure-Tailwind Bar Charts and Visuals */}
            <div className="grid grid-cols-3 gap-6">
              
              {/* Chart 1: Inventory distribution by category */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 col-span-2 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-4 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-600" /> WMS 物理库存类目分布占比
                </h4>
                <div className="space-y-3.5">
                  {(() => {
                    // Aggregate snapshots by category
                    const categorySums: { [key: string]: number } = {};
                    snapshots.forEach(s => {
                      categorySums[s.category] = (categorySums[s.category] || 0) + s.physical_qty;
                    });
                    const total = Object.values(categorySums).reduce((a, b) => a + b, 0) || 1;
                    
                    return Object.entries(categorySums).map(([cat, qty]) => {
                      const pct = (qty / total) * 100;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-medium">{cat}</span>
                            <span className="font-mono text-gray-700 font-semibold">{qty.toLocaleString()} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-50 h-2.5 rounded-full overflow-hidden border border-gray-100">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                cat === '面料' ? 'bg-emerald-500' :
                                cat === '里布' ? 'bg-teal-500' :
                                cat === '织带' ? 'bg-sky-500' :
                                cat === '拉链' ? 'bg-indigo-500' : 'bg-purple-500'
                              }`} 
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Chart 2: Alerts breakdown & quick links */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600" /> 低库存及缺货异常监视
                  </h4>
                  <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                    系统在手机现场出库、盘点动作完结后，会秒级校对该 SKU 在所有仓位总和与安全库存的差值，并在此触发告警。
                  </p>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {alerts.filter(a => a.status !== '已处理').slice(0, 3).map(a => (
                      <div key={a.alert_no} className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-gray-700">{a.material_code}</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                            a.alert_type === '缺货' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}>
                            {a.alert_type}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{a.material_name}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-1">
                          当前存量: {a.current_qty} | 安全线: {a.safety_stock}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveMenu('alerts')}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-center text-xs font-bold transition-all mt-4 text-emerald-700 cursor-pointer shadow-sm"
                >
                  查看全部预警表记录 →
                </button>
              </div>

            </div>

            {/* 3. Recent activity list */}
            <div className="grid grid-cols-3 gap-6">
              
              <div className="bg-white border border-gray-200 rounded-2xl p-4 col-span-2 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-600" /> 仓库最近出入库流水账
                </h4>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100 font-semibold text-[10px]">
                        <th className="py-2">流水凭证</th>
                        <th className="py-2">动作类别</th>
                        <th className="py-2">物料编码</th>
                        <th className="py-2">变动数</th>
                        <th className="py-2">操作货位</th>
                        <th className="py-2 text-right">变动时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {movements.slice(0, 5).map(m => (
                        <tr key={m.movement_no} className="hover:bg-gray-50/50 text-xs transition-all">
                          <td className="py-2 text-gray-400">{m.movement_no}</td>
                          <td className="py-2 font-sans">
                            <span className={`px-1.5 py-0.5 rounded-md font-semibold text-[10px] ${
                              m.movement_type.includes('入库') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {m.movement_type}
                            </span>
                          </td>
                          <td className="py-2 text-gray-700">{m.material_code}</td>
                          <td className={`py-2 font-black ${m.quantity_change > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                          </td>
                          <td className="py-2 text-gray-600 font-semibold">{m.location_code}</td>
                          <td className="py-2 text-right text-[10px] text-gray-400">{m.operation_time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending reviews */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" /> 主管待审批事务
                </h4>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  需要仓库主管、财务或者PMC审批的补货及差异核销明细。
                </p>

                <div className="space-y-2 max-h-[190px] overflow-y-auto">
                  {documents.filter(d => d.status === '待审核').map(d => (
                    <div key={d.document_no} className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-gray-700 block">{d.document_no}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{d.document_type} • 创建: {d.creator}</span>
                      </div>
                      <button
                        onClick={() => {
                          if (d.document_type === '入库单') setActiveMenu('inbound');
                          else if (d.document_type === '出库单') setActiveMenu('outbound');
                          else setActiveMenu('counting');
                        }}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                      >
                        去审核
                      </button>
                    </div>
                  ))}

                  {documents.filter(d => d.status === '待审核').length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs font-medium">
                      ☕ 暂无待审批的单据，库房流水账一切正常！
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: MATERIALS MASTER */}
        {/* ======================================================== */}
        {activeMenu === 'materials' && (
          <div className="space-y-4">
            
            {/* Filter controls */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-center text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-bold text-gray-500">筛选物料：</span>
              </div>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="" className="bg-white text-gray-800">全部品类</option>
                {['面料', '拉链', '里布', '五金', '扣具', '织带', '拉头', '包装', '辅料'].map(c => (
                  <option key={c} value={c} className="bg-white text-gray-800">{c}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="" className="bg-white text-gray-800">全部状态</option>
                <option value="启用" className="bg-white text-gray-800">启用</option>
                <option value="停用" className="bg-white text-gray-800">停用</option>
              </select>

              {/* Reset filter */}
              {(categoryFilter || statusFilter || searchQuery) && (
                <button
                  onClick={() => {
                    setCategoryFilter('');
                    setStatusFilter('');
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-700 font-bold cursor-pointer"
                >
                  重置筛选条件
                </button>
              )}
            </div>

            {/* List and detail grid split */}
            <div className="grid grid-cols-3 gap-6">
              
              {/* Table List of Materials (Left 2 cols) */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden col-span-2 shadow-sm">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">物料编号</th>
                        <th className="py-3 px-4">物料图</th>
                        <th className="py-3 px-4">物料名称</th>
                        <th className="py-3 px-4">类别</th>
                        <th className="py-3 px-4">规格规格</th>
                        <th className="p-3 font-mono">安全库存</th>
                        <th className="p-3 text-right">默认供应商</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {materials
                        .filter(m => {
                          const matchSearch = m.material_code.toLowerCase().includes(searchQuery.toLowerCase()) || m.material_name.toLowerCase().includes(searchQuery.toLowerCase());
                          const matchCat = categoryFilter ? m.category === categoryFilter : true;
                          const matchStatus = statusFilter ? m.status === statusFilter : true;
                          return matchSearch && matchCat && matchStatus;
                        })
                        .map(m => (
                          <tr
                            key={m.material_code}
                            onClick={() => setSelectedMatCode(m.material_code)}
                            className={`hover:bg-slate-850/60 cursor-pointer transition-all ${
                              selectedMatCode === m.material_code ? 'bg-gray-100 border-l-4 border-l-emerald-600' : ''
                            }`}
                          >
                            <td className="p-3 font-mono font-bold text-emerald-600">{m.material_code}</td>
                            <td className="py-3 px-4">
                              <img src={m.image} className="w-9 h-9 rounded-md object-cover bg-white border border-gray-100" alt="img" />
                            </td>
                            <td className="p-3 font-semibold text-gray-800">{m.material_name}</td>
                            <td className="py-3 px-4">
                              <span className="bg-gray-50 px-2 py-1 rounded-md text-[10px] border border-gray-100 font-semibold text-gray-600">
                                {m.category}
                              </span>
                            </td>
                            <td className="p-3 text-gray-500">{m.specification}</td>
                            <td className="p-3 font-mono text-amber-600 font-semibold">{m.safety_stock} {m.unit}</td>
                            <td className="p-3 text-right text-gray-500 truncate max-w-[120px]">{m.supplier}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Material Drawer detail (Right 1 col) */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                {selectedMatCode ? (
                  (() => {
                    const m = materials.find(mat => mat.material_code === selectedMatCode)!;
                    const matchedSnaps = snapshots.filter(s => s.material_code === m.material_code);
                    const totalQty = matchedSnaps.reduce((acc, s) => acc + s.physical_qty, 0);
                    
                    return (
                      <div className="space-y-4 text-xs">
                        {/* Title and image */}
                        <div className="text-center space-y-2 border-b border-gray-100 pb-3">
                          <img src={m.image} className="w-20 h-20 rounded-xl mx-auto object-cover border border-gray-200" alt="img" />
                          <h4 className="font-extrabold text-sm text-gray-800">{m.material_name}</h4>
                          <span className="font-mono text-emerald-600 font-bold">{m.material_code}</span>
                        </div>

                        {/* Detailed Key-Values */}
                        <div className="space-y-2 font-sans">
                          <div className="flex justify-between border-b border-gray-100 pb-1.5 text-xs">
                            <span className="text-gray-400">颜色代码:</span>
                            <span className="font-semibold text-gray-700 flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: m.color_code }}></span>
                              {m.color} ({m.color_code})
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-gray-100 pb-1.5 text-xs">
                            <span className="text-gray-400">单位换算:</span>
                            <span className="font-semibold text-gray-700 font-mono">{m.conversion_rate}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-100 pb-1.5 text-xs">
                            <span className="text-gray-400">安全库存限额:</span>
                            <span className="font-semibold text-amber-600 font-mono">{m.safety_stock} {m.unit}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-100 pb-1.5 text-xs">
                            <span className="text-gray-400">最小采购MOQ:</span>
                            <span className="font-semibold text-gray-700 font-mono">{m.min_order_qty} {m.unit}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-100 pb-1.5 text-xs">
                            <span className="text-gray-400">采购交期:</span>
                            <span className="font-semibold text-gray-700 font-mono">{m.lead_time_days} 天</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-100 pb-1.5 text-xs">
                            <span className="text-gray-400">默认供应商:</span>
                            <span className="font-semibold text-gray-700 text-right truncate max-w-[150px]">{m.supplier}</span>
                          </div>
                        </div>

                        {/* Inventory Per Bin list */}
                        <div className="space-y-2 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">实体库存仓位分布：</span>
                          
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {matchedSnaps.map(snap => (
                              <div key={snap.id} className="flex justify-between items-center text-xs font-mono border-b border-gray-100 pb-1">
                                <span className="text-gray-500">{snap.warehouse_name} • <strong className="text-amber-600">{snap.location_code}</strong></span>
                                <span className="font-bold text-gray-700">{snap.physical_qty} {snap.unit}</span>
                              </div>
                            ))}
                            {matchedSnaps.length === 0 && (
                              <div className="text-[10px] text-gray-400 italic py-2 text-center">
                                ⚠️ 当前全仓库位均无此实物库存！
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between border-t border-gray-100 pt-2 font-bold font-sans text-xs">
                            <span className="text-gray-500">总库物理存数:</span>
                            <span className={totalQty < m.safety_stock ? 'text-amber-600' : 'text-emerald-600'}>
                              {totalQty} {m.unit} {totalQty < m.safety_stock && '(低于安全储备)'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-100 p-2 text-[10px] text-gray-500 rounded-lg leading-relaxed font-mono">
                          备注说明: {m.remark}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-gray-400 text-xs font-semibold">
                    <Package className="w-12 h-12 stroke-[1] text-gray-300 mb-2" />
                    请在左侧列表中点击具体的物料SKU，以在此展示仓库实时分布详情、货位分布、供求参数及条码规则。
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: PHYSICAL SNAPSHOTS */}
        {/* ======================================================== */}
        {activeMenu === 'snapshots' && (
          <div className="space-y-4">
            
            {/* Warning reminder */}
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 leading-relaxed flex items-start gap-2.5 shadow-sm">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-gray-800">重要安全防错指引：</span>
                <p className="mt-1 font-medium text-emerald-950/80">
                  这是实物库存表。在 Factory WMS 架构设计中，<b>此处的库存实数全部由出入库流水(Stock Movement Ledger)自动累加或扣减更新，任何角色（包括超级管理员）均无权在此直接进行数值覆写</b>。所有的数量修正，必须通过手机PDA现场执行入库、领用、或者生成「盘盈/盘亏差异单」提交审核落库，以保证每一次数量异动都可被财务审计穿透。
                </p>
              </div>
            </div>

            {/* Snapshot list table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-700 font-bold">实存物料快照 ({snapshots.length} 条物理位置分布)</span>
                <button 
                  onClick={() => alert('WMS 物理库存快照已生成。Excel 导出成功！ (Mock Export)')}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg flex items-center gap-1.5 cursor-pointer text-xs shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> 导出 WMS 物理库存表
                </button>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">物料SKU</th>
                      <th className="py-3 px-4">名称</th>
                      <th className="py-3 px-4">所属仓库</th>
                      <th className="py-3 px-4">通道库位</th>
                      <th className="py-3 px-4">物理批次号</th>
                      <th className="p-3 font-mono">账面实存</th>
                      <th className="p-3 font-mono">可用额</th>
                      <th className="p-3 font-mono">分配锁定</th>
                      <th className="py-3 px-4">库存状态</th>
                      <th className="p-3 text-right">最近盘点时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {snapshots
                      .filter(s => {
                        const matchSearch = s.material_code.toLowerCase().includes(searchQuery.toLowerCase()) || s.material_name.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchWh = warehouseFilter ? s.warehouse_code === warehouseFilter : true;
                        return matchSearch && matchWh;
                      })
                      .map(s => (
                        <tr key={s.id} className="hover:bg-gray-50/50 transition-all">
                          <td className="p-3 font-bold text-emerald-600">{s.material_code}</td>
                          <td className="p-3 font-sans text-gray-800 font-semibold">{s.material_name}</td>
                          <td className="p-3 font-sans text-gray-500">{s.warehouse_name}</td>
                          <td className="p-3 font-bold text-amber-600">{s.location_code}</td>
                          <td className="p-3 text-gray-400 text-xs">{s.batch_no}</td>
                          <td className="p-3 font-black text-gray-700">{s.physical_qty} {s.unit}</td>
                          <td className="p-3 font-semibold text-gray-600">{s.available_qty} {s.unit}</td>
                          <td className="p-3 text-gray-400">{s.reserved_qty} {s.unit}</td>
                          <td className="p-3 font-sans">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              s.stock_status === '正常' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              s.stock_status === '低库存' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              s.stock_status === '缺货' ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' :
                              'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {s.stock_status}
                            </span>
                          </td>
                          <td className="p-3 text-right text-[10px] text-gray-400 font-sans">{s.last_count_time || '尚未盘点'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: INBOUND AUDIT */}
        {/* ======================================================== */}
        {activeMenu === 'inbound' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">待主管及财务审核的采购/退料入库单单据</h4>
            
            <div className="space-y-3">
              {documents.filter(d => d.document_type === '入库单').map(doc => (
                <div key={doc.document_no} className="bg-white border border-gray-200 rounded-xl p-4 text-xs font-sans shadow-sm">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-sm text-gray-800">{doc.document_no}</span>
                      <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-500 text-[10px] font-mono border border-gray-200">{doc.sub_type}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getDocStatusStyles(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-xs text-gray-400 mb-3 font-mono">
                    <div>物理仓库: <strong className="text-gray-700 font-sans">{doc.warehouse_code}</strong></div>
                    <div>录入员: <strong className="text-gray-700 font-sans">{doc.creator}</strong></div>
                    <div>递交时间: <strong className="text-gray-700">{doc.created_at}</strong></div>
                    <div>审核批复: <strong className="text-gray-700 font-sans">{doc.auditor ? `${doc.auditor} (${doc.audited_at})` : '未审核'}</strong></div>
                  </div>

                  {/* Document Items Detail */}
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 mb-3">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-gray-400 font-bold border-b border-gray-200 pb-1">
                          <th className="pb-1">物料编码</th>
                          <th className="pb-1">名称及规格</th>
                          <th className="pb-1">预配货位</th>
                          <th className="pb-1">批次</th>
                          <th className="pb-1 text-right">计划数</th>
                          <th className="pb-1 text-right">扫码实收</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/50 font-mono text-gray-600">
                        {doc.items.map((it, idx) => (
                          <tr key={idx} className="text-gray-600">
                            <td className="py-1.5 font-bold text-emerald-600">{it.material_code}</td>
                            <td className="py-1.5 font-sans text-gray-700">{it.material_name} ({it.specification})</td>
                            <td className="py-1.5 text-amber-600 font-semibold">{it.location_code}</td>
                            <td className="py-1.5 text-gray-400">{it.batch_no}</td>
                            <td className="py-1.5 text-right">{it.planned_qty} {it.unit}</td>
                            <td className="py-1.5 text-right font-bold text-emerald-600">{it.actual_qty} {it.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions (Only if Pending Audit) */}
                  {doc.status === '待审核' && (
                    <div className="flex justify-end gap-2.5">
                      <button
                        onClick={() => {
                          // Update document in place, plus we simulate the automatic stock update
                          auditDocument(doc.document_no, '已完成', `主管钱主管 (${currentUserRole})`);
                          // Process the automatic compensating stock in update to simulate high-fidelity
                          doc.items.forEach(it => {
                            addStockIn({
                              materialCode: it.material_code,
                              subType: doc.sub_type as any,
                              warehouseCode: doc.warehouse_code,
                              locationCode: it.location_code,
                              batchNo: it.batch_no,
                              quantity: it.planned_qty,
                              remark: '采购单批量自动审批登账',
                              operator: `主管批准审核 (${currentUserRole})`
                            });
                          });
                          alert('采购入库单已审核通过，已生成正式异动流水账并自动增加相应货位库存！');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer transition-all shadow-sm"
                      >
                        ✅ 审批通过并登账
                      </button>
                      <button
                        onClick={() => {
                          auditDocument(doc.document_no, '已取消', `钱主管 (${currentUserRole})`);
                          alert('单据已被标记为作废/驳回');
                        }}
                        className="px-3.5 py-1.5 bg-white hover:bg-gray-50 text-gray-500 rounded-lg font-bold border border-gray-200 cursor-pointer transition-all shadow-sm"
                      >
                        驳回
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: OUTBOUND AUDIT */}
        {/* ======================================================== */}
        {activeMenu === 'outbound' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">已提交的车间生产领料及出库记录中心</h4>
            
            <div className="space-y-3">
              {documents.filter(d => d.document_type === '出库单').map(doc => (
                <div key={doc.document_no} className="bg-white border border-gray-200 rounded-xl p-4 text-xs font-sans shadow-sm">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-sm text-gray-800">{doc.document_no}</span>
                      <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-500 text-[10px] font-mono border border-gray-200">{doc.sub_type}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      已实发出库
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-xs text-gray-400 mb-3 font-mono">
                    <div>出货库房: <strong className="text-gray-700 font-sans">{doc.warehouse_code}</strong></div>
                    <div>出库员: <strong className="text-gray-700 font-sans">{doc.creator}</strong></div>
                    <div>发放时间: <strong className="text-gray-700">{doc.created_at}</strong></div>
                    <div>领用说明: <strong className="text-gray-700 font-sans">{doc.remark}</strong></div>
                  </div>

                  {/* Items Detail */}
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-gray-400 font-bold border-b border-gray-200 pb-1">
                          <th className="pb-1">物料编码</th>
                          <th className="pb-1">名称及规格</th>
                          <th className="pb-1">出库货位</th>
                          <th className="pb-1">物理批次号</th>
                          <th className="pb-1 text-right">计划发料</th>
                          <th className="pb-1 text-right">扫码实发</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/50 font-mono text-gray-600">
                        {doc.items.map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 font-bold text-amber-600">{it.material_code}</td>
                            <td className="py-1.5 font-sans text-gray-700">{it.material_name} ({it.specification})</td>
                            <td className="py-1.5 text-gray-500">{it.location_code}</td>
                            <td className="py-1.5 text-gray-400">{it.batch_no}</td>
                            <td className="py-1.5 text-right">{it.planned_qty} {it.unit}</td>
                            <td className="py-1.5 text-right font-bold text-amber-600">{it.actual_qty} {it.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: COUNTING TASKS */}
        {/* ======================================================== */}
        {activeMenu === 'counting' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">随机及周期性实盘盘点单列表记录</h4>
            
            <div className="space-y-3">
              {documents.filter(d => d.document_type === '盘点单').map(doc => (
                <div key={doc.document_no} className="bg-white border border-gray-200 rounded-xl p-4 text-xs font-sans shadow-sm">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-sm text-gray-800">{doc.document_no}</span>
                      <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-500 text-[10px] font-mono border border-gray-200">{doc.sub_type}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getDocStatusStyles(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>

                  <p className="text-xs text-amber-700 font-medium mb-3 bg-amber-50 py-1 px-2 border border-amber-200 rounded">
                    账面核对结论：{doc.remark}
                  </p>

                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 mb-3">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-gray-400 font-bold border-b border-gray-200 pb-1">
                          <th className="pb-1">盘点物料</th>
                          <th className="pb-1">货架位置</th>
                          <th className="pb-1">盘点批次</th>
                          <th className="pb-1 text-right">账面数量</th>
                          <th className="pb-1 text-right">实盘数量</th>
                          <th className="pb-1 text-right">实存盈亏差异</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/50 font-mono text-gray-600">
                        {doc.items.map((it, idx) => {
                          const diff = it.actual_qty - it.planned_qty;
                          return (
                            <tr key={idx}>
                              <td className="py-1.5 font-bold text-purple-600">{it.material_code}</td>
                              <td className="py-1.5 font-sans text-amber-600 font-semibold">{it.location_code}</td>
                              <td className="py-1.5 text-gray-400">{it.batch_no}</td>
                              <td className="py-1.5 text-right text-gray-400">{it.planned_qty} {it.unit}</td>
                              <td className="py-1.5 text-right font-bold text-gray-700">{it.actual_qty} {it.unit}</td>
                              <td className={`py-1.5 text-right font-black ${diff === 0 ? 'text-gray-400' : diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diff === 0 ? '完全一致' : diff > 0 ? `+${diff}` : diff}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {doc.status === '待审核' && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          auditDocument(doc.document_no, '已完成', `钱主管 (${currentUserRole})`);
                          alert('盘点差异已由主管审核同意登账修正！');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer transition-all shadow-sm"
                      >
                        审核通过 (同意冲正)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: LEDGER */}
        {/* ======================================================== */}
        {activeMenu === 'ledger' && (
          <div className="space-y-4">
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-center text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-bold text-gray-500">流水筛选：</span>
              </div>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">全部品类</option>
                {['面料', '拉链', '里布', '五金', '扣具', '织带', '拉头', '包装'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">全部异动类型</option>
                {['采购入库', '生产退料', '盘盈入库', '生产领料', '样品领料', '报废出库', '盘亏出库'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs font-semibold text-gray-700">
                <span>出入库主流水账本 Ledger (由扫码事件直接物理追加，财务只读防作弊)</span>
                <span className="text-xs text-gray-400 font-normal">每一次库存变化都会生成凭证，历史异动永远保留</span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 text-xs">
                    <tr>
                      <th className="py-3 px-4">流水编号</th>
                      <th className="py-3 px-4">作业类型</th>
                      <th className="py-3 px-4">物料SKU</th>
                      <th className="py-3 px-4">物料名称</th>
                      <th className="py-3 px-4">位置货架</th>
                      <th className="p-3 text-right">原库存</th>
                      <th className="p-3 text-right">异动量</th>
                      <th className="p-3 text-right">变动后新库存</th>
                      <th className="py-3 px-4">提交作业员</th>
                      <th className="p-3 text-right">物理入账时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono text-xs">
                    {movements
                      .filter(m => {
                        const matchSearch = m.material_code.toLowerCase().includes(searchQuery.toLowerCase()) || m.material_name.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchCat = categoryFilter ? m.category === categoryFilter : true;
                        const matchType = statusFilter ? m.movement_type === statusFilter : true;
                        return matchSearch && matchCat && matchType;
                      })
                      .map(m => (
                        <tr key={m.movement_no} className="hover:bg-gray-50/50 transition-all">
                          <td className="p-3 font-bold text-gray-400">{m.movement_no}</td>
                          <td className="p-3 font-sans">
                            <span className={`px-1.5 py-0.5 rounded-md font-semibold text-[10px] ${
                              m.movement_type.includes('入库') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {m.movement_type}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-emerald-600">{m.material_code}</td>
                          <td className="p-3 font-sans text-gray-600 truncate max-w-[150px]">{m.material_name}</td>
                          <td className="p-3 text-amber-600 font-bold">{m.location_code}</td>
                          <td className="p-3 text-right text-gray-400">{m.quantity_before} {m.unit}</td>
                          <td className={`p-3 text-right font-black ${m.quantity_change > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                          </td>
                          <td className="p-3 text-right text-gray-700 font-bold">{m.quantity_after} {m.unit}</td>
                          <td className="p-3 font-sans text-gray-500">{m.operator.replace(' (Warehouse Staff)', '')}</td>
                          <td className="p-3 text-right text-gray-400 text-[10px] font-sans">{m.operation_time}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: ALERTS TABLE */}
        {/* ======================================================== */}
        {activeMenu === 'alerts' && (
          <div className="space-y-4">
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-center text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-bold text-gray-500">分类筛选预警：</span>
              </div>
              <select
                value={alertTypeFilter}
                onChange={(e) => setAlertTypeFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">所有报警类型</option>
                <option value="低库存">低库存</option>
                <option value="缺货">缺货 (已清空)</option>
                <option value="盘点差异">盘点大差异</option>
                <option value="负库存风险">负库存阻断</option>
              </select>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">预警凭证</th>
                      <th className="py-3 px-4">类型</th>
                      <th className="py-3 px-4">严重级</th>
                      <th className="py-3 px-4">物料SKU</th>
                      <th className="py-3 px-4">名称</th>
                      <th className="p-3 text-right">安全水位线</th>
                      <th className="p-3 text-right">当前总余量</th>
                      <th className="p-3 text-right">缺口补齐建议量</th>
                      <th className="py-3 px-4">推荐决策动作</th>
                      <th className="py-3 px-4">当前跟进状态</th>
                      <th className="p-3 text-right">跟进人</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono text-xs">
                    {alerts
                      .filter(a => alertTypeFilter ? a.alert_type === alertTypeFilter : true)
                      .map(a => (
                        <tr key={a.alert_no} className="hover:bg-gray-50/50 transition-all">
                          <td className="p-3 font-bold text-gray-400">{a.alert_no}</td>
                          <td className="p-3 font-sans font-bold">
                            <span className={`px-2 py-0.5 rounded-md ${
                              a.alert_type === '缺货' ? 'bg-red-50 text-red-700 border border-red-200' :
                              a.alert_type === '负库存风险' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              a.alert_type === '低库存' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-purple-50 text-purple-700 border border-purple-100'
                            }`}>
                              {a.alert_type}
                            </span>
                          </td>
                          <td className="p-3 font-sans">
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              a.severity === '高' ? 'bg-red-50 text-red-700 border border-red-200' :
                              a.severity === '中' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-sky-50 text-sky-700 border border-sky-100'
                            }`}>
                              {a.severity}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-emerald-600">{a.material_code}</td>
                          <td className="p-3 font-sans text-gray-700">{a.material_name}</td>
                          <td className="p-3 text-right text-gray-400">{a.safety_stock}</td>
                          <td className="p-3 text-right text-gray-700 font-bold">{a.current_qty}</td>
                          <td className="p-3 text-right text-red-600 font-bold">{a.shortage_qty}</td>
                          <td className="p-3 font-sans text-gray-500 max-w-[180px] truncate">{a.suggested_action}</td>
                          <td className="p-3 font-sans">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              a.status === '已处理' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              a.status === '处理中' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' :
                              'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="p-3 text-right font-sans">
                            {a.status !== '已处理' ? (
                              <button
                                onClick={() => {
                                  resolveAlert(a.alert_no, `管理员钱主管 (${currentUserRole})`);
                                  alert('预警已被标记为「已处理」');
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-gray-50 text-emerald-600 hover:text-emerald-700 border border-gray-200 rounded-lg text-[10px] font-semibold cursor-pointer shadow-sm transition-all"
                              >
                                快速标为已处理
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400">{a.handled_by || '系统解除'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: REPORTS */}
        {/* ======================================================== */}
        {activeMenu === 'reports' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-3 gap-6 text-xs">
              
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" /> 仓库库位有效利用率饱和度
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">原材料仓 (RAW-WH)</span>
                      <span className="font-bold text-gray-700">5 / 8 个货位占用 (62.5%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200/50">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '62.5%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">辅料五金仓 (ACC-WH)</span>
                      <span className="font-bold text-gray-700">4 / 8 个货位占用 (50%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200/50">
                      <div className="bg-teal-600 h-full rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">样品仓 (SAMPLE-WH)</span>
                      <span className="font-bold text-gray-700">2 / 4 个货位占用 (50%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200/50">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 mt-5 leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
                  由货位关联 snapshots 的物理实存汇总，货位总容量可在「基础设置」中增加扩展。
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 col-span-2 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-600" /> 背包物料本周高频消耗领用排行 TOP 5
                </h4>
                
                <div className="space-y-3">
                  {[
                    { code: 'FAB-210D-BK', name: '210D 尼龙面料 (黑色)', count: 300, unit: '米', pct: 90 },
                    { code: 'WEB-025-BK', name: '25mm 黑色织带', count: 1000, unit: '米', pct: 85 },
                    { code: 'ZIP-005-BK', name: '5# 黑色尼龙拉链', count: 200, unit: '米', pct: 60 },
                    { code: 'BUCKLE-025-POM', name: '25mm POM 插扣', count: 800, unit: '个', pct: 50 },
                    { code: 'THREAD-POLY-BK', name: '黑色涤纶缝纫线', count: 72, unit: '卷', pct: 40 },
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50/60 p-2 rounded border border-gray-100 hover:bg-white transition-all">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-400 w-4">#{idx+1}</span>
                        <div>
                          <span className="font-bold text-gray-700 block">{item.code}</span>
                          <span className="text-[10px] text-gray-400 block">{item.name}</span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-black text-amber-600 block">-{item.count} {item.unit}</span>
                        <span className="text-[9px] text-gray-400">本周发出</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: SETTINGS & BASIC SETUP */}
        {/* ======================================================== */}
        {activeMenu === 'settings' && (
          <div className="space-y-6 text-xs font-sans">
            
            {/* Database Rules Board */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-xs shadow-sm">
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" /> WMS 物理数据流与 PostgreSQL 库表架构规则
              </h4>
              <p className="text-gray-500 leading-relaxed mb-4">
                Factory WMS 采用流水驱动存货快照模式。系统遵循严格的事务一致性规则：
              </p>

              <div className="grid grid-cols-3 gap-4 font-sans text-gray-600">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-emerald-700 block mb-1">1. 流水强约束规则</span>
                  所有实物库存 <code>physical_qty</code> 的任何变化，必须<b>先</b>创建 <code>stock_movements</code> 物理流水，由出入库事件反向计算汇总到 <code>inventory_snapshots</code> 存货快照表。禁止任何系统手工随意直接重写快照数量。
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-emerald-700 block mb-1">2. 外部只读与API代理</span>
                  外部采购产品管理 (PMS)、物料清单 (BOM)、或者销售管理系统，一律<b>无权直连物理写库</b>，只能通过 <code>WMS API Gateway</code> 进行可用库存查询，或注册 Webhook 触发采购、发放预留。
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-emerald-700 block mb-1">3. 自动高敏告警触发器</span>
                  PostgreSQL 中将采用 <code>AFTER INSERT ON stock_movements</code> 后置触发器。当最新快照水位低于对应物料的 <code>safety_stock</code>，自动生成 <code>material_alerts</code> 告警信息。
                </div>
              </div>
            </div>

            {/* Architecture diagram */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-xs shadow-sm">
              <h4 className="font-bold text-gray-700 mb-6 flex justify-center items-center gap-1.5 text-xs uppercase tracking-wider">
                <Cpu className="w-4 h-4 text-emerald-600" /> WMS 数据网关 & PostgreSQL 物理分布式集成拓扑图
              </h4>
              
              <div className="max-w-2xl mx-auto flex flex-col items-center space-y-4">
                
                {/* Layer 1: Client Systems */}
                <div className="grid grid-cols-4 gap-3 w-full">
                  <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-gray-600 hover:bg-white hover:shadow-sm transition-all">
                    <span className="font-bold block text-indigo-600 text-[10px]">PMS / 产品数据管理</span>
                    <span className="text-[9px] text-gray-400">同步物料、BOM、规格</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-gray-600 hover:bg-white hover:shadow-sm transition-all">
                    <span className="font-bold block text-sky-600 text-[10px]">ERP / 财务及总账系统</span>
                    <span className="text-[9px] text-gray-400">拉取库存估值、盘点盈亏</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-gray-600 hover:bg-white hover:shadow-sm transition-all">
                    <span className="font-bold block text-emerald-600 text-[10px]">MES / 现场制造系统</span>
                    <span className="text-[9px] text-gray-400">触发生产领料、退料扣减</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-gray-600 hover:bg-white hover:shadow-sm transition-all">
                    <span className="font-bold block text-purple-600 text-[10px]">B2B / 订单发货系统</span>
                    <span className="text-[9px] text-gray-400">查询可用量、追加销售锁定</span>
                  </div>
                </div>

                <div className="w-[1px] h-6 bg-gray-200"></div>

                {/* Layer 2: API gateway */}
                <div className="bg-emerald-600 text-white font-extrabold px-6 py-2 rounded-xl text-xs shadow-sm tracking-wider flex items-center gap-2">
                  <span>WMS API INTERFACE & AUTHENTICATION (Restful / Sync Gateway)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>

                <div className="w-[1px] h-6 bg-gray-200"></div>

                {/* Layer 3: Main Database Schema */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 w-full text-left font-mono">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                    <span className="text-emerald-700 font-bold text-xs flex items-center gap-1.5">
                      <Database className="w-4 h-4" /> PostgreSQL Database (factory_wms_db)
                    </span>
                    <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500">Primary DB Engine</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-[10px]">
                    <div className="bg-white p-2 rounded border border-gray-150">
                      <strong className="text-gray-800 block mb-1">1. movements_ledger</strong>
                      - movement_no (PK)<br />
                      - movement_type<br />
                      - material_code (FK)<br />
                      - quantity_change<br />
                      - operator_time<br />
                      <span className="text-[9px] text-emerald-600 block mt-1.5">★ 触发快照自动核减</span>
                    </div>

                    <div className="bg-white p-2 rounded border border-gray-150">
                      <strong className="text-gray-800 block mb-1">2. inventory_snapshots</strong>
                      - snapshot_id (PK)<br />
                      - material_code (FK)<br />
                      - warehouse_code<br />
                      - location_code (FK)<br />
                      - physical_qty<br />
                      - available_qty
                    </div>

                    <div className="bg-white p-2 rounded border border-gray-150">
                      <strong className="text-gray-800 block mb-1">3. material_alerts</strong>
                      - alert_no (PK)<br />
                      - alert_type<br />
                      - severity<br />
                      - shortage_qty<br />
                      - suggest_action<br />
                      - status
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* PostgreSQL API keys mock form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-xs font-sans shadow-sm">
              <h4 className="font-bold text-gray-700 mb-3">系统集成物理配对配置 (模拟)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 mb-1">PostgreSQL 连接字符串 (Connection String)</label>
                    <input 
                      type="text" 
                      value="postgresql://wms_admin:pwd_secure2026@pg-host-factory-run.db:5432/factory_wms_db?sslmode=require" 
                      disabled
                      className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 font-mono text-[10px] text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">对接外部 MES Webhook 目标地址</label>
                    <input 
                      type="text" 
                      placeholder="https://mes.backpackfactory.com/api/v1/wms-sync-receiver" 
                      className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 font-mono text-[10px]"
                    />
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-amber-700 block mb-1">⚠️ 生产过渡提醒</span>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      当前为零配置 Web 版本。您可以使用手机扫码枪进行增删，所有库存数据在全局 context 内存及 localState 自动落盘，断开浏览器标签页也不丢失。在未来的正式数据库上线对接中，只需要编写后台服务控制器直连上方的物理库表，前端即可无缝衔接。
                    </p>
                  </div>
                  <button 
                    onClick={() => alert('WMS 接口通讯测试正常！数据库握手时延: 2ms')}
                    className="w-full mt-2 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer shadow-sm transition-all"
                  >
                    进行联机通讯 Ping 测试
                  </button>
                </div>
              </div>
            </div>

            {/* Integration ends, continue settings */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Warehouse Locations Setup */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-700">货架四级物理货位定位表 ({locations.length} 个)</h4>
                  <button
                    onClick={() => setShowAddLoc(true)}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> 增加新货位
                  </button>
                </div>

                {/* Add Location Modal Simulation */}
                {showAddLoc && (
                  <form onSubmit={handleCreateLocation} className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3 space-y-3">
                    <span className="block font-bold text-gray-700 text-xs">添加注册物理货位码</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">物理定位编码 (e.g. A01-02-02)</label>
                        <input
                          type="text"
                          required
                          value={newLocCode}
                          onChange={(e) => setNewLocCode(e.target.value)}
                          placeholder="通道-排-架-位"
                          className="bg-white border border-gray-200 text-xs rounded p-1.5 w-full font-mono text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">货位位置中文释义</label>
                        <input
                          type="text"
                          required
                          value={newLocName}
                          onChange={(e) => setNewLocName(e.target.value)}
                          placeholder="例如: 原料架A区1层02位"
                          className="bg-white border border-gray-200 text-xs rounded p-1.5 w-full text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">归属物理仓库</label>
                      <select
                        value={newLocWh}
                        onChange={(e) => setNewLocWh(e.target.value)}
                        className="bg-white border border-gray-200 text-xs rounded p-1.5 w-full text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="RAW-WH">原材料仓 (RAW-WH)</option>
                        <option value="ACC-WH">辅料五金仓 (ACC-WH)</option>
                        <option value="SAMPLE-WH">样品仓 (SAMPLE-WH)</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddLoc(false)}
                        className="px-2.5 py-1 bg-white border border-gray-200 text-gray-500 rounded hover:bg-gray-50"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-sm"
                      >
                        确定添加
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {locations.map(l => (
                    <div key={l.location_code} className="bg-gray-50 p-2.5 rounded-lg border border-gray-150 flex justify-between items-center text-xs font-mono hover:bg-white hover:shadow-sm transition-all">
                      <div>
                        <strong className="text-amber-600">{l.location_code}</strong>
                        <span className="text-gray-400 block text-[10px] mt-0.5 font-sans">{l.location_name} • 仓库: {l.warehouse_code}</span>
                      </div>
                      <span className="text-[9px] bg-white border border-gray-200 text-gray-400 px-2 py-0.5 rounded">
                        条码: {l.barcode}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barcode Rules and setup */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm">
                <h4 className="font-bold text-gray-700">WMS 物理PDA及扫码规则配置</h4>
                <p className="text-gray-500 text-xs leading-relaxed">
                  可绑定仓库现场手持 PDA 的物理扫码规则。扫描标签后，系统按照正则前缀自动映射对应的业务表关联：
                </p>

                <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="font-bold text-gray-400">物料标签码匹配格式：</span>
                    <span className="font-mono text-gray-600">纯字符串 SKU 码 (例如 FAB-210D-BK)</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="font-bold text-gray-400">物理批次号匹配：</span>
                    <span className="font-mono text-gray-600">前缀: <code>BATCH-*</code></span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="font-bold text-gray-400">库架库位二维码：</span>
                    <span className="font-mono text-gray-600">格式: <code>[大写字母][数字]-[数字]-[数字]</code> (例如 A01-01-01)</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 leading-relaxed text-[10px]">
                  <b>💡 条码规则可编辑性：</b>在生产过渡时，可按此格式通过 Restful API 进行物料绑定生成条码标签直接打印。WMS 支持无缝导出为标准的 ZPL 打印格式进行标签热敏打印。
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
