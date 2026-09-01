import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Warehouse, Database, ArrowDownLeft, ArrowUpRight,
  SlidersHorizontal, History, Users, FileText, X, ScanLine, ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { canManageUsers, canViewLogs } from '../../auth/role';
import type { Role } from '../../types/api';

const operatorNav = [
  { to: '/scanner', label: '扫码工作台', icon: ScanLine },
  { to: '/counting', label: '库存盘点', icon: ClipboardCheck },
  { to: '/inventory', label: '库存查询', icon: Database },
  { to: '/movements', label: '库存流水', icon: History },
];

const viewerNav = [
  { to: '/dashboard', label: '库存看板', icon: LayoutDashboard },
  { to: '/inventory', label: '库存查询', icon: Database },
  { to: '/movements', label: '库存流水', icon: History },
];

const managerNav = [
  { to: '/dashboard', label: '控制台', icon: LayoutDashboard },
  { to: '/scanner', label: '扫码工作台', icon: ScanLine },
  { to: '/counting', label: '库存盘点', icon: ClipboardCheck },
  { to: '/inventory', label: '库存查询', icon: Database },
  { to: '/stock-in', label: '入库管理', icon: ArrowDownLeft },
  { to: '/stock-out', label: '出库管理', icon: ArrowUpRight },
  { to: '/adjustments', label: '库存调整', icon: SlidersHorizontal },
  { to: '/movements', label: '库存流水', icon: History },
  { to: '/items', label: '物料管理', icon: Package },
  { to: '/warehouses', label: '仓库管理', icon: Warehouse },
  { to: '/locations', label: '库位管理', icon: Database },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function navigationFor(role: Role) {
  if (role === 'OPERATOR') return operatorNav;
  if (role === 'VIEWER') return viewerNav;
  return managerNav;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const role = user?.role || 'VIEWER';
  const navItems = navigationFor(role);
  const operatorMode = role === 'OPERATOR';

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 ${operatorMode ? 'w-56' : 'w-64'} bg-slate-900 text-white flex flex-col transform transition-transform lg:transform-none ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center font-bold text-lg shadow">W</div>
            <div>
              <div className="font-bold text-sm tracking-wider">WMS</div>
              <div className="text-[10px] text-slate-400 -mt-0.5">{operatorMode ? '仓库作业台' : '仓库管理系统'}</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {operatorMode && (
          <div className="mx-3 mt-4 rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wider text-emerald-400">Operator Mode</div>
            <div className="mt-0.5 text-sm font-semibold text-white">仓管员作业模式</div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 ${operatorMode ? 'py-3.5 text-base' : 'py-2.5 text-sm'} rounded-xl font-medium transition-all ${
                  isActive ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className={`${operatorMode ? 'w-5 h-5' : 'w-4.5 h-4.5'} shrink-0`} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {!operatorMode && (canViewLogs(role) || canManageUsers(role)) && (
            <div className="border-t border-slate-700 pt-3 mt-3">
              {canViewLogs(role) && (
                <NavLink to="/operation-logs" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <FileText className="w-4.5 h-4.5 shrink-0" /><span>操作日志</span>
                </NavLink>
              )}
              {canManageUsers(role) && (
                <NavLink to="/users" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <Users className="w-4.5 h-4.5 shrink-0" /><span>用户管理</span>
                </NavLink>
              )}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
          {operatorMode ? 'Warehouse Station' : 'Warehouse Pilot v1'}
        </div>
      </aside>
    </>
  );
}
