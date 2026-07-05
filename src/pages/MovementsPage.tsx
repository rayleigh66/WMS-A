import { useState, useEffect } from 'react';
import { movementsApi } from '../api/movements';
import type { StockMovement, PaginatedResponse } from '../types/api';
import { MOVEMENT_TYPE_LABELS } from '../types/api';
import { Loading, ErrorAlert } from '../components/ui/Alerts';
import { Pagination } from '../components/ui/Pagination';

export default function MovementsPage() {
  const [data, setData] = useState<PaginatedResponse<StockMovement> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [detail, setDetail] = useState<StockMovement | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    movementsApi.list({ page: String(page), pageSize: '20', movementType: typeFilter || undefined })
      .then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, [page, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">全部类型</option>
          {Object.entries(MOVEMENT_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
      </div>
      {error && <ErrorAlert message={error} onRetry={load} />}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">流水号</th><th className="text-left px-4 py-3">物料</th><th className="text-left px-4 py-3">类型</th>
              <th className="text-left px-4 py-3">仓库/库位</th><th className="text-right px-4 py-3">变动前</th><th className="text-right px-4 py-3">变动</th>
              <th className="text-right px-4 py-3">变动后</th><th className="text-left px-4 py-3">操作人</th><th className="text-left px-4 py-3">时间</th>
            </tr></thead>
            <tbody>
              {data?.data.map((m) => (
                <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setDetail(m)}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.movementNo}</td>
                  <td className="px-4 py-3"><div className="font-medium">{m.item?.itemName}</div><div className="text-xs text-gray-400">{m.item?.itemCode}</div></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.movementType === 'STOCK_IN' ? 'bg-blue-50 text-blue-700' : m.movementType === 'STOCK_OUT' ? 'bg-orange-50 text-orange-700' : 'bg-purple-50 text-purple-700'}`}>{MOVEMENT_TYPE_LABELS[m.movementType] || m.movementType}</span></td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{m.warehouse?.warehouseName}<br />{m.location?.locationName}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-500">{Number(m.quantityBefore)}</td>
                  <td className={`px-4 py-3 text-right font-mono font-medium ${Number(m.quantityChange) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{Number(m.quantityChange) >= 0 ? '+' : ''}{Number(m.quantityChange)}</td>
                  <td className="px-4 py-3 text-right font-mono">{Number(m.quantityAfter)}</td>
                  <td className="px-4 py-3 text-gray-600">{m.operator?.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(m.createdAt).toLocaleString('zh-CN')}</td>
                </tr>
              ))}
              {(!data?.data || data.data.length === 0) && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">暂无流水数据</td></tr>}
            </tbody>
          </table>
        </div>
        {data && <div className="px-4 py-3 border-t"><Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} /></div>}
      </div>
      {loading && <Loading />}

      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b"><h3 className="font-bold">流水详情</h3></div>
            <div className="p-6 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-400">流水号</span><div className="font-mono text-xs">{detail.movementNo}</div></div>
                <div><span className="text-gray-400">类型</span><div>{MOVEMENT_TYPE_LABELS[detail.movementType]}</div></div>
                <div><span className="text-gray-400">物料</span><div>{detail.item?.itemName} ({detail.item?.itemCode})</div></div>
                <div><span className="text-gray-400">来源</span><div>{detail.sourceType}</div></div>
                <div><span className="text-gray-400">仓库</span><div>{detail.warehouse?.warehouseName}</div></div>
                <div><span className="text-gray-400">库位</span><div>{detail.location?.locationName}</div></div>
                <div><span className="text-gray-400">变动前</span><div className="font-mono">{Number(detail.quantityBefore)}</div></div>
                <div><span className="text-gray-400">变动</span><div className={`font-mono ${Number(detail.quantityChange) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{Number(detail.quantityChange) >= 0 ? '+' : ''}{Number(detail.quantityChange)}</div></div>
                <div><span className="text-gray-400">变动后</span><div className="font-mono">{Number(detail.quantityAfter)}</div></div>
                <div><span className="text-gray-400">操作人</span><div>{detail.operator?.name}</div></div>
              </div>
              {detail.remark && <div className="text-gray-500">{detail.remark}</div>}
              <div className="text-gray-400 text-xs">{new Date(detail.createdAt).toLocaleString('zh-CN')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
