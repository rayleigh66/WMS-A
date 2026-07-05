import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { inventoryApi } from '../api/inventory';
import { warehousesApi } from '../api/warehouses';
import type { InventoryItem, PaginatedResponse, Warehouse } from '../types/api';
import { CATEGORY_LABELS } from '../types/api';
import { Loading, ErrorAlert } from '../components/ui/Alerts';
import { Pagination } from '../components/ui/Pagination';

export default function InventoryPage() {
  const [data, setData] = useState<PaginatedResponse<InventoryItem> | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [whFilter, setWhFilter] = useState('');
  const [lowStock, setLowStock] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<InventoryItem | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      inventoryApi.list({ page: String(page), pageSize: '20', search: search || undefined, category: category || undefined, warehouseId: whFilter || undefined, lowStock: lowStock || undefined }),
      warehousesApi.list(),
    ]).then(([inv, whs]) => { setData(inv); setWarehouses(whs); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, category, whFilter, lowStock]);

  const handleSearch = () => { setPage(1); load(); };

  const getStockStatus = (item: InventoryItem) => {
    if (Number(item.quantity) <= 0) return { label: '缺货', class: 'bg-red-50 text-red-700' };
    if (Number(item.quantity) < Number(item.safetyStock)) return { label: '低库存', class: 'bg-amber-50 text-amber-700' };
    return { label: '正常', class: 'bg-emerald-50 text-emerald-700' };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="搜索物料..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">全部分类</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        <select value={whFilter} onChange={(e) => { setWhFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">全部仓库</option>
          {warehouses.map((w) => (<option key={w.id} value={w.id}>{w.warehouseName}</option>))}
        </select>
        <select value={lowStock} onChange={(e) => { setLowStock(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">库存状态</option>
          <option value="true">仅低库存</option>
        </select>
      </div>

      {error && <ErrorAlert message={error} onRetry={load} />}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">物料编码</th><th className="text-left px-4 py-3">名称</th><th className="text-left px-4 py-3">分类</th>
              <th className="text-left px-4 py-3">仓库</th><th className="text-left px-4 py-3">库位</th><th className="text-right px-4 py-3">数量</th>
              <th className="text-right px-4 py-3">安全库存</th><th className="text-center px-4 py-3">状态</th>
            </tr></thead>
            <tbody>
              {data?.data.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setDetail(item)}>
                    <td className="px-4 py-3 font-mono text-xs">{item.itemCode}</td>
                    <td className="px-4 py-3 font-medium">{item.itemName}</td>
                    <td className="px-4 py-3 text-gray-600">{CATEGORY_LABELS[item.category] || item.category}</td>
                    <td className="px-4 py-3">{item.warehouseName}</td>
                    <td className="px-4 py-3 text-gray-500">{item.locationName}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{Number(item.quantity)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{Number(item.safetyStock)}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.class}`}>{status.label}</span></td>
                  </tr>
                );
              })}
              {(!data?.data || data.data.length === 0) && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无库存数据</td></tr>}
            </tbody>
          </table>
        </div>
        {data && <div className="px-4 py-3 border-t border-gray-100"><Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} /></div>}
      </div>
      {loading && <Loading />}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-lg">库存详情</h3></div>
            <div className="p-6 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><div className="text-gray-400">物料编码</div><div className="font-medium">{detail.itemCode}</div></div>
                <div><div className="text-gray-400">物料名称</div><div className="font-medium">{detail.itemName}</div></div>
                <div><div className="text-gray-400">分类</div><div>{CATEGORY_LABELS[detail.category]}</div></div>
                <div><div className="text-gray-400">单位</div><div>{detail.unit}</div></div>
                <div><div className="text-gray-400">仓库</div><div>{detail.warehouseName}</div></div>
                <div><div className="text-gray-400">库位</div><div>{detail.locationName}</div></div>
                <div><div className="text-gray-400">当前数量</div><div className="text-lg font-bold text-emerald-600">{Number(detail.quantity)}</div></div>
                <div><div className="text-gray-400">安全库存</div><div>{Number(detail.safetyStock)}</div></div>
              </div>
              <div className="text-gray-400 text-xs">更新时间：{new Date(detail.updatedAt).toLocaleString('zh-CN')}</div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 text-right"><button onClick={() => setDetail(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">关闭</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
