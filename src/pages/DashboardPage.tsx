import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '../api/dashboard';
import type { DashboardData, StockMovement } from '../types/api';
import { Loading, ErrorAlert } from '../components/ui/Alerts';
import { StatCard } from '../components/ui/StatCard';
import { MOVEMENT_TYPE_LABELS } from '../types/api';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    dashboardApi.get()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <Loading />;
  if (error) return <ErrorAlert message={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="总物料" value={data.totalItems} icon={<Package className="w-6 h-6" />} />
        <StatCard title="总库存" value={Number(data.totalInventoryQuantity).toLocaleString()} icon={<LayoutDashboard className="w-6 h-6" />} />
        <StatCard title="低库存" value={data.lowStockItems} icon={<AlertTriangle className="w-6 h-6" />} className="bg-amber-50 border-amber-200" />
        <StatCard title="今日入库" value={Number(data.todayStockInQuantity).toLocaleString()} icon={<TrendingDown className="w-6 h-6" />} className="bg-blue-50 border-blue-200" />
        <StatCard title="今日出库" value={Number(data.todayStockOutQuantity).toLocaleString()} icon={<TrendingUp className="w-6 h-6" />} className="bg-orange-50 border-orange-200" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">最近库存流水</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3">流水号</th>
                <th className="text-left px-5 py-3">物料</th>
                <th className="text-left px-5 py-3">类型</th>
                <th className="text-right px-5 py-3">变动</th>
                <th className="text-left px-5 py-3">仓库</th>
                <th className="text-left px-5 py-3">操作人</th>
                <th className="text-left px-5 py-3">时间</th>
              </tr>
            </thead>
            <tbody>
              {data.recentMovements.map((m) => (
                <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{m.movementNo}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium">{m.item?.itemName}</div>
                    <div className="text-xs text-gray-400">{m.item?.itemCode}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {MOVEMENT_TYPE_LABELS[m.movementType] || m.movementType}
                    </span>
                  </td>
                  <td className={`px-5 py-3 text-right font-mono font-medium ${Number(m.quantityChange) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {Number(m.quantityChange) >= 0 ? '+' : ''}{m.quantityChange}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{m.warehouse?.warehouseName}</td>
                  <td className="px-5 py-3 text-gray-600">{m.operator?.name}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(m.createdAt).toLocaleString('zh-CN')}</td>
                </tr>
              ))}
              {data.recentMovements.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">暂无流水数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
