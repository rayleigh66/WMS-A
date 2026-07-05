import { useState, useEffect } from 'react';
import { Plus, Eye } from 'lucide-react';
import { stockOutApi } from '../api/stockOut';
import { itemsApi } from '../api/items';
import { warehousesApi } from '../api/warehouses';
import { locationsApi } from '../api/locations';
import type { StockOutOrder, PaginatedResponse, Item, Warehouse, Location } from '../types/api';
import { STOCK_OUT_TYPE_LABELS } from '../types/api';
import { useAuth } from '../auth/AuthProvider';
import { canWrite } from '../auth/role';
import { Loading, ErrorAlert } from '../components/ui/Alerts';
import { Pagination } from '../components/ui/Pagination';
import { ApiError } from '../api/client';

export default function StockOutPage() {
  const { user } = useAuth();
  const role = user?.role || 'VIEWER';
  const [data, setData] = useState<PaginatedResponse<StockOutOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [detail, setDetail] = useState<StockOutOrder | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState('PRODUCTION_PICKING');
  const [formWh, setFormWh] = useState('');
  const [formRemark, setFormRemark] = useState('');
  const [formLines, setFormLines] = useState<{ itemId: string; locationId: string; quantity: number; unit: string }[]>([{ itemId: '', locationId: '', quantity: 0, unit: '' }]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    stockOutApi.list(String(page), '20').then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [page]);

  const openCreate = async () => {
    try {
      const [its, whs] = await Promise.all([itemsApi.list({ pageSize: '200', status: 'ACTIVE' }), warehousesApi.list()]);
      setItems(its.data); setWarehouses(whs);
      setFormType('PRODUCTION_PICKING'); setFormWh(whs[0]?.id || ''); setFormRemark('');
      setFormLines([{ itemId: '', locationId: '', quantity: 0, unit: '' }]); setFormOpen(true);
    } catch (err: any) { setError(err.message); }
  };

  const handleWhChange = async (whId: string) => {
    setFormWh(whId);
    try { const locs = await locationsApi.list(whId); setLocations(locs); setFormLines(formLines.map((l) => ({ ...l, locationId: '' }))); } catch {}
  };

  const addLine = () => setFormLines([...formLines, { itemId: '', locationId: '', quantity: 0, unit: '' }]);
  const removeLine = (i: number) => formLines.length > 1 && setFormLines(formLines.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: string, value: any) => {
    const lines = [...formLines];
    (lines[i] as any)[field] = value;
    if (field === 'itemId') { const it = items.find((x) => x.id === value); if (it) lines[i].unit = it.unit; }
    setFormLines(lines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = formLines.filter((l) => l.itemId && l.locationId && l.quantity > 0);
    if (valid.length === 0) { setFormError('请填写至少一条有效明细'); return; }
    setSaving(true); setFormError('');
    try {
      await stockOutApi.create({ type: formType, warehouseId: formWh, remark: formRemark, items: valid });
      setFormOpen(false); load();
    } catch (err: any) { setFormError(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {canWrite(role) && <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"><Plus className="w-4 h-4" /> 新建出库单</button>}
      {error && <ErrorAlert message={error} onRetry={load} />}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <th className="text-left px-4 py-3">单号</th><th className="text-left px-4 py-3">类型</th><th className="text-left px-4 py-3">仓库</th>
            <th className="text-left px-4 py-3">操作人</th><th className="text-right px-4 py-3">明细数</th><th className="text-left px-4 py-3">时间</th><th className="text-center px-4 py-3">操作</th>
          </tr></thead>
          <tbody>
            {data?.data.map((o) => (
              <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{o.orderNo}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">{STOCK_OUT_TYPE_LABELS[o.type] || o.type}</span></td>
                <td className="px-4 py-3">{o.warehouse?.warehouseName}</td>
                <td className="px-4 py-3 text-gray-600">{o.operator?.name}</td>
                <td className="px-4 py-3 text-right">{o.items?.length}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.createdAt).toLocaleString('zh-CN')}</td>
                <td className="px-4 py-3 text-center"><button onClick={() => setDetail(o)} className="text-emerald-600"><Eye className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {(!data?.data || data.data.length === 0) && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无出库单</td></tr>}
          </tbody>
        </table>
        {data && <div className="px-4 py-3 border-t border-gray-100"><Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} /></div>}
      </div>
      {loading && <Loading />}

      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b"><h3 className="font-bold">出库单详情 - {detail.orderNo}</h3></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-gray-400">类型：</span>{STOCK_OUT_TYPE_LABELS[detail.type] || detail.type}</div>
                <div><span className="text-gray-400">仓库：</span>{detail.warehouse?.warehouseName}</div>
                <div><span className="text-gray-400">操作人：</span>{detail.operator?.name}</div>
              </div>
              {detail.remark && <div className="text-sm text-gray-500">备注：{detail.remark}</div>}
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead><tr className="bg-gray-50 text-gray-500 text-xs"><th className="px-3 py-2 text-left">物料</th><th className="px-3 py-2 text-left">库位</th><th className="px-3 py-2 text-right">数量</th><th className="px-3 py-2 text-left">备注</th></tr></thead>
                <tbody>{detail.items.map((i) => (<tr key={i.id} className="border-t"><td className="px-3 py-2">{i.item?.itemName} ({i.item?.itemCode})</td><td className="px-3 py-2 text-gray-500">{i.location?.locationName}</td><td className="px-3 py-2 text-right font-mono">{Number(i.quantity)} {i.unit}</td><td className="px-3 py-2 text-gray-400">{i.remark || '-'}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setFormOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b"><h3 className="font-bold text-lg">新建出库单</h3></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">出库类型</label><select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{Object.entries(STOCK_OUT_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></div>
                <div><label className="block text-sm font-medium mb-1">仓库 *</label><select value={formWh} onChange={(e) => handleWhChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{warehouses.map((w) => (<option key={w.id} value={w.id}>{w.warehouseName}</option>))}</select></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm font-medium">明细行</span><button type="button" onClick={addLine} className="text-xs text-emerald-600 hover:underline">+ 添加行</button></div>
                {formLines.map((line, i) => (
                  <div key={i} className="flex flex-wrap items-end gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-[150px]"><select value={line.itemId} onChange={(e) => updateLine(i, 'itemId', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm"><option value="">物料</option>{items.filter((it) => it.status === 'ACTIVE').map((it) => (<option key={it.id} value={it.id}>{it.itemCode}</option>))}</select></div>
                    <div className="w-28"><select value={line.locationId} onChange={(e) => updateLine(i, 'locationId', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm"><option value="">库位</option>{locations.map((l) => (<option key={l.id} value={l.id}>{l.locationCode}</option>))}</select></div>
                    <div className="w-24"><input type="number" min="0.001" step="1" value={line.quantity || ''} onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))} placeholder="数量" className="w-full px-2 py-1.5 border rounded-lg text-sm" /></div>
                    <div className="w-20"><span className="text-sm text-gray-500 py-1.5 block">{line.unit}</span></div>
                    {formLines.length > 1 && <button type="button" onClick={() => removeLine(i)} className="text-red-400 text-lg">×</button>}
                  </div>
                ))}
              </div>
              <div><label className="block text-sm font-medium mb-1">备注</label><input value={formRemark} onChange={(e) => setFormRemark(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 border rounded-lg text-sm">取消</button><button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:bg-emerald-400">{saving ? '提交中...' : '提交出库'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
