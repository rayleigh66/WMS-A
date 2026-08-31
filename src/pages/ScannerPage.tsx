import { useEffect, useMemo, useRef, useState } from 'react';
import { ScanLine, ArrowDownLeft, ArrowUpRight, Trash2, CheckCircle2 } from 'lucide-react';
import { itemsApi } from '../api/items';
import { warehousesApi } from '../api/warehouses';
import { locationsApi } from '../api/locations';
import { stockInApi } from '../api/stockIn';
import { stockOutApi } from '../api/stockOut';
import type { Item, Warehouse, Location } from '../types/api';

interface ScanLineItem { item: Item; quantity: number; }
type Mode = 'IN' | 'OUT';
const newRequestId = () => crypto.randomUUID();

export default function ScannerPage() {
  const [mode, setMode] = useState<Mode>('OUT');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [scanValue, setScanValue] = useState('');
  const [lines, setLines] = useState<ScanLineItem[]>([]);
  const [message, setMessage] = useState('请扫描商品条码 / SKU 编码');
  const [messageType, setMessageType] = useState<'idle' | 'ok' | 'error'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(newRequestId());

  const resetSession = () => {
    setLines([]);
    requestIdRef.current = newRequestId();
  };

  useEffect(() => {
    warehousesApi.list().then((data) => {
      setWarehouses(data);
      if (data[0]?.id) setWarehouseId(data[0].id);
    }).catch(() => setMessage('仓库数据加载失败'));
  }, []);

  useEffect(() => {
    if (!warehouseId) return;
    locationsApi.list(warehouseId).then((data) => {
      setLocations(data.filter((x) => x.status === 'ACTIVE'));
      setLocationId(data.find((x) => x.status === 'ACTIVE')?.id || '');
      resetSession();
    }).catch(() => setLocations([]));
  }, [warehouseId]);

  useEffect(() => { inputRef.current?.focus(); }, [mode, warehouseId, locationId, lines.length]);
  const total = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);

  const beep = (ok: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = ok ? 880 : 220;
      gain.gain.value = 0.05;
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.start(); oscillator.stop(ctx.currentTime + (ok ? 0.06 : 0.16));
    } catch { /* visual feedback remains */ }
  };

  const handleScan = async () => {
    const code = scanValue.trim();
    setScanValue('');
    if (!code) return;
    if (!warehouseId || !locationId) {
      setMessageType('error'); setMessage('请先选择仓库和库位'); beep(false); return;
    }
    try {
      const item = await itemsApi.resolveScan(code);
      setLines((current) => {
        const existing = current.find((line) => line.item.id === item.id);
        if (existing) return current.map((line) => line.item.id === item.id ? { ...line, quantity: line.quantity + 1 } : line);
        return [{ item, quantity: 1 }, ...current];
      });
      setMessageType('ok'); setMessage(`${item.itemCode} · ${item.itemName} +1`); beep(true);
    } catch (err: any) {
      setMessageType('error'); setMessage(err?.message || `未识别：${code}`); beep(false);
    } finally { requestAnimationFrame(() => inputRef.current?.focus()); }
  };

  const changeQty = (itemId: string, delta: number) => {
    setLines((current) => current.map((line) => line.item.id === itemId ? { ...line, quantity: line.quantity + delta } : line).filter((line) => line.quantity > 0));
  };

  const submit = async () => {
    if (!lines.length || !warehouseId || !locationId || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        requestId: requestIdRef.current,
        warehouseId,
        remark: '仓库扫码工作台',
        items: lines.map((line) => ({ itemId: line.item.id, locationId, quantity: line.quantity, unit: line.item.unit, remark: 'USB/HID 扫码' })),
      };
      if (mode === 'IN') await stockInApi.create({ ...payload, type: 'OTHER' });
      else await stockOutApi.create({ ...payload, type: 'SALES' });
      const submittedTotal = total;
      resetSession();
      setMessageType('ok'); setMessage(`${mode === 'IN' ? '入库' : '出库'}成功，共 ${submittedTotal} 件`); beep(true);
    } catch (err: any) {
      setMessageType('error');
      setMessage(err?.message || '提交失败；可直接重试，系统会用同一请求号防止重复记账');
      beep(false);
    } finally { setSubmitting(false); requestAnimationFrame(() => inputRef.current?.focus()); }
  };

  const switchMode = (next: Mode) => { setMode(next); resetSession(); setMessageType('idle'); setMessage('请扫描商品条码 / SKU 编码'); };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">仓库扫码工作台</h1><p className="text-sm text-slate-500 mt-1">USB / 蓝牙 HID / 手套扫码枪均按键盘输入处理，建议设置扫码后自动回车。</p></div>
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button onClick={() => switchMode('OUT')} className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${mode === 'OUT' ? 'bg-white shadow text-rose-700' : 'text-slate-500'}`}><ArrowUpRight className="w-4 h-4" /> 扫码出库</button>
          <button onClick={() => switchMode('IN')} className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${mode === 'IN' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}><ArrowDownLeft className="w-4 h-4" /> 扫码入库</button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 grid md:grid-cols-2 gap-4">
        <label className="text-sm font-medium text-slate-700">仓库<select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white">{warehouses.filter((w) => w.status === 'ACTIVE').map((w) => <option key={w.id} value={w.id}>{w.warehouseName}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">库位<select value={locationId} onChange={(e) => { setLocationId(e.target.value); resetSession(); }} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white">{locations.map((l) => <option key={l.id} value={l.id}>{l.locationCode} - {l.locationName}</option>)}</select></label>
      </div>

      <div className={`rounded-2xl border-2 p-6 ${mode === 'IN' ? 'border-emerald-300 bg-emerald-50/40' : 'border-rose-300 bg-rose-50/40'}`}>
        <div className="flex items-center gap-3 mb-4"><ScanLine className="w-7 h-7" /><div><div className="font-bold">请扫描商品</div><div className="text-xs text-slate-500">当前模式：{mode === 'IN' ? '入库' : '出库'}</div></div></div>
        <input ref={inputRef} value={scanValue} onChange={(e) => setScanValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleScan(); } }} autoComplete="off" placeholder="扫描 SKU / 商品条码后自动回车" className="w-full px-4 py-4 text-xl font-mono border border-slate-300 rounded-xl bg-white outline-none focus:ring-4 focus:ring-emerald-100" />
        <div className={`mt-3 text-sm font-medium ${messageType === 'ok' ? 'text-emerald-700' : messageType === 'error' ? 'text-rose-700' : 'text-slate-500'}`}>{message}</div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"><div className="font-bold">本次扫描</div><div className="text-sm">SKU {lines.length} 种 · 合计 <span className="text-xl font-bold">{total}</span> 件</div></div>
        {lines.length === 0 ? <div className="py-12 text-center text-slate-400">等待扫码</div> : <div className="divide-y divide-slate-100">{lines.map((line) => <div key={line.item.id} className="px-5 py-3 flex items-center gap-4"><div className="flex-1 min-w-0"><div className="font-mono font-semibold">{line.item.itemCode}</div><div className="text-sm text-slate-500 truncate">{line.item.itemName}{line.item.color ? ` · ${line.item.color}` : ''}</div></div><div className="flex items-center gap-2"><button onClick={() => changeQty(line.item.id, -1)} className="w-9 h-9 rounded-lg border">−</button><span className="w-12 text-center font-bold text-lg">{line.quantity}</span><button onClick={() => changeQty(line.item.id, 1)} className="w-9 h-9 rounded-lg border">+</button></div><button onClick={() => setLines((c) => c.filter((x) => x.item.id !== line.item.id))} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-5 h-5" /></button></div>)}</div>}
        <div className="p-5 border-t border-slate-100 flex justify-between gap-3"><button onClick={resetSession} disabled={!lines.length || submitting} className="px-4 py-3 rounded-xl border border-slate-200 text-sm disabled:opacity-40">清空</button><button onClick={() => void submit()} disabled={!lines.length || submitting || !warehouseId || !locationId} className={`px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2 disabled:opacity-40 ${mode === 'IN' ? 'bg-emerald-600' : 'bg-rose-600'}`}><CheckCircle2 className="w-5 h-5" />{submitting ? '提交中…' : `确认${mode === 'IN' ? '入库' : '出库'} ${total} 件`}</button></div>
      </div>
    </div>
  );
}
