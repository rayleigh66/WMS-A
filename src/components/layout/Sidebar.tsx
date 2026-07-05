import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Warehouse, Database, ArrowDownLeft, ArrowUpRight,
  SlidersHorizontal, History, Users, FileText, Settings, X,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { canManageUsers, canViewLogs } from '../../auth/role';

const navItems = [
  { to: '/dashboard', label: '控制台', icon: LayoutDashboard },
  { to: '/items', label: '物料管理', icon: Package },
  { to: '/warehouses', label: '仓库管理', icon: Warehouse },
  { to: '/locations', label: '库位管理', icon: Database },
  { to: '/inventory', label: '库存查询', icon: Database },
  { to: '/stock-in', label: '入库管理', icon: ArrowDownLeft },
  { to: '/stock-out', label: '出库管理', icon: ArrowUpRight },
  { to: '/adjustments', label: '库存调整', icon: SlidersHorizontal },
  { to: '/movements', label: '库存流水', icon: History },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const role = user?.role || 'VIEWER';

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform lg:transform-none ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center font-bold text-lg shadow">W</div>
            <div>
              <div className="font-bold text-sm tracking-wider">WMS</div>
              <div className="text-[10px] text-slate-400 -mt-0.5">仓库管理系统</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="border-t border-slate-700 pt-3 mt-3">
            {canViewLogs(role) && (
              <NavLink
                to="/operation-logs"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <FileText className="w-4.5 h-4.5 shrink-0" />
                <span>操作日志</span>
              </NavLink>
            )}
            {canManageUsers(role) && (
              <NavLink
                to="/users"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Users className="w-4.5 h-4.5 shrink-0" />
                <span>用户管理</span>
              </NavLink>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
          v0.1.0
        </div>
      </aside>
    </>
  );
}
