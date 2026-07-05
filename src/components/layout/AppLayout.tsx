import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageTitles: Record<string, string> = {
  '/dashboard': '控制台',
  '/items': '物料管理',
  '/warehouses': '仓库管理',
  '/locations': '库位管理',
  '/inventory': '库存查询',
  '/stock-in': '入库管理',
  '/stock-out': '出库管理',
  '/adjustments': '库存调整',
  '/movements': '库存流水',
  '/users': '用户管理',
  '/operation-logs': '操作日志',
};

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'WMS';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
