import { useEffect, useMemo, useRef, useState } from 'react';
import { ScanLine, ClipboardCheck, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { itemsApi } from '../api/items';
import { warehousesApi } from '../api/warehouses';
import { locationsApi } from '../api/locations';
import { inventoryApi } from '../api/inventory';
import { adjustmentsApi } from '../api/adjustments';
import type { Item, Location, Warehouse } from '../types/api';

type CountRow = {
  item: Item;
  actual: number;
  systemQty: number;
  submitted?: boolean;
};

export default function CountingPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [scanValue, setScanValue] = useState('');
  const [rows, setRows] = useState<CountRow[]>([]);
  const [message, setMessage] = useState('盲盘模式：系统库存不会在盘点前显示');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    warehousesApi.list().then((data) => {
      const active = data.filter((w) => w.status === 'ACTIVE');
      setWarehouses(active);
      if (active[0]) setWarehouseId(active[0].id);
    }).catch((e) => setMessage(e.message));
  }, []);

  useEffect(() => {
    if (!warehouseId) return;
    locationsApi.list(warehouseId).then((data) => {
      const active = data.filter((l) => l.status === 'ACTIVE');
      setLocations(active);
      setLocationId(active[0]?.id || '');
      setRows([]);
    }).catch((e) => setMessage(e.message));
  }, [warehouseId]);

  useEffect(() => { inputRef.current?.focus(); }, [rows.length, locationId]);

  const totalActual = useMemo(() => rows.reduce((sum, row) => sum + row.actual, 0), [rows]);
  const differenceCount = useMemo(() => rows.filter((row) => row.actual !== row.systemQty).length, [rows]);

  const scan = async () => {
    const code = scanValue.trim();
    setScanValue('');
    if (!code || !warehouseId || !locationId) return;
    try {
      const item = await itemsApi.resolveScan(code);
      const inv = await inventoryApi.list({ page: '1', pageSize: '100', search: item.itemCode, warehouseId, locationId });
      const current = inv.data.find((x) => x.itemId === item.id && x.locationId === locationId);
      const systemQty = Number(current?.quantity || 0);
      setRows((prev) => {
        const exists = prev.find((r) => r.item.id === item.id);
        if (exists) return prev.map((r) => r.item.id === item.id ? { ...r, actual: r.actual + 1 } : r);
        return [{ item, actual: 1, systemQty }, ...prev];
      });
      setMessage(`${item.itemCode} +1`);
    } catch (e: any) {
      setMessage(e.message || `未识别：${code}`);
    } finally {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const updateActual = (itemId: string, value: number) => {
    setRows((prev) => prev.map((r) => r.item.id === itemId ? { ...r, actual: Math.max(0, value) } : r));
  };

  const clear = () => {
    if (rows.length && !window.confirm('清空本次盘点记录？')) return;
    setRows([]);
    setMessage('盲盘模式：系统库存不会在盘点前显示');
  };

  const submit = async () => {
    if (!rows.length || !warehouseId || !locationId || saving) return;
    const diffs = rows.filter((r) => r.actual !== r.systemQty);
    if (!diffs.length) {
      setMessage('盘点完成：本次无库存差异');
      setRows((prev) => prev.map((r) => ({ ...r, submitted: true })));
      return;
    }
    if (!window.confirm(`发现 ${diffs.length} 个 SKU 存在差异，确认按实盘数量生成库存调整？`)) return;
    setSaving(true);
    try {
      await adjustmentsApi.create({
        warehouseId,
        reason: '循环盘点差异',
        remark: `盲盘提交 · ${new Date().toLocaleString('zh-CN')}`,
        items: diffs.map((r) => ({
          itemId: r.item.id,
          locationId,
          quantityAfter: r.actual,
          unit: r.item.unit,
          remark: `盘点差异 ${r.actual - r.systemQty >= 0 ? '+' : ''}${r.actual - r.systemQty}`,
        })),
      });
      setRows((prev) => prev.map((r) => ({ ...r, submitted: true })));
      setMessage(`盘点已提交：${diffs.length} 个 SKU 已生成库存调整`);
    } catch (e: any) {
      setMessage(e.message || '盘点提交失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">库存盘点</h1>
          <p className="text-sm text-slate-500 mt-1">默认盲盘：先录入实盘数量，提交后才显示系统差异。</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 text-amber-800 text-sm font-semibold"><AlertTriangle className="w-4 h-4" /> 盘点差异会生成库存调整</div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 grid md:grid-cols-2 gap-4">
        <label className="text-sm font-medium text-slate-700">仓库<select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white">{warehouses.map((w) => <option key={w.id} value={w.id}>{w.warehouseName}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">库位<select value={locationId} onChange={(e) => { setLocationId(e.target.value); setRows([]); }} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white">{locations.map((l) => <option key={l.id} value={l.id}>{l.locationCode} - {l.locationName}</option>)}</select></label>
      </div>

      <div className="rounded-3xl border-2 border-indigo-200 bg-indigo-50/50 p-6">
        <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center"><ScanLine className="w-7 h-7" /></div><div><div className="text-xl font-black">扫描盘点</div><div className="text-sm text-slate-500">同一 SKU 重复扫描自动累计</div></div></div>
        <input ref={inputRef} value={scanValue} onChange={(e) => setScanValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void scan(); } }} placeholder="扫描商品条码 / SKU" className="w-full px-5 py-5 text-2xl font-mono border-2 border-slate-300 rounded-2xl bg-white outline-none focus:border-indigo-500" />
        <div className="mt-3 text-sm font-semibold text-slate-600">{message}</div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-white border rounded-2xl p-4"><div className="text-xs text-slate-400">已盘 SKU</div><div className="text-3xl font-black mt-1">{rows.length}</div></div>
        <div className="bg-white border rounded-2xl p-4"><div className="text-xs text-slate-400">实盘件数</div><div className="text-3xl font-black mt-1">{totalActual}</div></div>
        <div className="bg-white border rounded-2xl p-4"><div className="text-xs text-slate-400">差异 SKU</div><div className="text-3xl font-black mt-1">{rows.some((r) => r.submitted) ? differenceCount : '—'}</div></div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b font-bold flex items-center gap-2"><ClipboardCheck className="w-5 h-5" /> 本次盘点明细</div>
        {rows.length === 0 ? <div className="py-14 text-center text-slate-400">等待扫描</div> : <div className="divide-y">{rows.map((row) => {
          const revealed = row.submitted;
          const diff = row.actual - row.systemQty;
          return <div key={row.item.id} className="px-5 py-4 grid md:grid-cols-[1fr_170px_170px] gap-4 items-center">
            <div><div className="font-mono font-bold">{row.item.itemCode}</div><div className="text-sm text-slate-500">{row.item.itemName}{row.item.color ? ` · ${row.item.color}` : ''}</div></div>
            <label className="text-sm text-slate-500">实盘数量<input type="number" min="0" value={row.actual} disabled={revealed} onChange={(e) => updateActual(row.item.id, Number(e.target.value))} className="mt-1 w-full px-3 py-2.5 border rounded-xl text-lg font-bold disabled:bg-slate-50" /></label>
            <div className="text-sm">
              <div className="text-slate-400">系统 / 差异</div>
              {revealed ? <div className={`mt-1 text-lg font-bold ${diff === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{row.systemQty} / {diff >= 0 ? '+' : ''}{diff}</div> : <div className="mt-2 font-semibold text-slate-400">提交前隐藏</div>}
            </div>
          </div>;
        })}</div>}
        <div className="p-5 border-t flex flex-wrap justify-between gap-3">
          <button onClick={clear} disabled={!rows.length || saving} className="px-4 py-3 rounded-xl border flex items-center gap-2 disabled:opacity-40"><RotateCcw className="w-4 h-4" /> 清空</button>
          <button onClick={() => void submit()} disabled={!rows.length || saving || rows.some((r) => r.submitted)} className="px-7 py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 disabled:opacity-40"><CheckCircle2 className="w-5 h-5" /> {saving ? '提交中…' : '提交盘点结果'}</button>
        </div>
      </div>
    </div>
  );
}
