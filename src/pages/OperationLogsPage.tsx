import { useState, useEffect } from 'react';
import { operationLogsApi } from '../api/operationLogs';
import type { OperationLog, PaginatedResponse } from '../types/api';
import { Loading, ErrorAlert } from '../components/ui/Alerts';
import { Pagination } from '../components/ui/Pagination';

export default function OperationLogsPage() {
  const [data, setData] = useState<PaginatedResponse<OperationLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    operationLogsApi.list({ page: String(page), pageSize: '30', action: action || undefined })
      .then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, [page, action]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} placeholder="筛选操作类型..." className="border border-gray-200 rounded-lg px-4 py-2 text-sm max-w-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      {error && <ErrorAlert message={error} onRetry={load} />}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">时间</th><th className="text-left px-4 py-3">用户</th><th className="text-left px-4 py-3">操作</th><th className="text-left px-4 py-3">实体</th><th className="text-left px-4 py-3">详情</th>
            </tr></thead>
            <tbody>
              {data?.data.map((log) => (
                <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-3">{log.user?.name || '-'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{log.action}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{log.entityType}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.detail || '-'}</td>
                </tr>
              ))}
              {(!data?.data || data.data.length === 0) && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无操作日志</td></tr>}
            </tbody>
          </table>
        </div>
        {data && <div className="px-4 py-3 border-t"><Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} /></div>}
      </div>
      {loading && <Loading />}
    </div>
  );
}
