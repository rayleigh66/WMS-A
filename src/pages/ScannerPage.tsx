import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScanLine, ArrowDownLeft, ArrowUpRight, Trash2, CheckCircle2,
  Lock, Unlock, Undo2, AlertTriangle,
} from 'lucide-react';
import { itemsApi } from '../api/items';
import { warehousesApi } from '../api/warehouses';
import { locationsApi } from '../api/locations';
import { inventoryApi } from '../api/inventory';
import { stockInApi } from '../api/stockIn';
import { stockOutApi } from '../api/stockOut';
import { useAuth } from '../auth/AuthProvider';
import type { Item, Warehouse, Location } from '../types/api';

interface ScanLineItem {
  item: Item;
  quantity: number;
  available?: number;
}
type Mode = 'IN' | 'OUT';
type Feedback = 'idle' | 'ok' | 'error' | 'warning';

const newRequestId = () => crypto.randomUUID();
const STATION_KEY = 'wms.station.v1';

export default function ScannerPage() {
  const { user } = useAuth();
  const isOperator = user?.role === 'OPERATOR';
  const [mode, setMode] = useState<Mode>('OUT');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [stationLocked, setStationLocked] = useState(false);
  const [scanValue, setScanValue] = useState('');
  const [lines, setLines] = useState<ScanLineItem[]>([]);
  const [message, setMessage] = useState('请扫描商品条码 / SKU 编码');
  const [messageType, setMessageType] = useState<Feedback>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<Feedback>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(newRequestId());
  const flashTimerRef = useRef<number | null>(null);

  const activeWarehouse = warehouses.find((w) => w.id === warehouseId);
  const activeLocation = locations.find((l) => l.id === locationId);
  const total = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);

  const resetSession = () => {
    setLines([]);
    requestIdRef.current = newRequestId();
  };

  const triggerFeedback = (type: Feedback, text: string) => {
    setMessageType(type);
    setMessage(text);
    setFlash(type);
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setFlash('idle'), type === 'error' ? 450 : 220);
  };

  useEffect(() => () => {
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
  }, []);

  useEffect(() => {
    warehousesApi.list().then((data) => {
      const active = data.filter((w) => w.status === 'ACTIVE');
      setWarehouses(active);
      const saved = localStorage.getItem(STATION_KEY);
      if (saved) {
        try {
          const station = JSON.parse(saved) as { warehouseId?: string; locationId?: string };
          if (station.warehouseId && active.some((w) => w.id === station.warehouseId)) {
            setWarehouseId(station.warehouseId);
            setLocationId(station.locationId || '');
            setStationLocked(true);
            return;
          }
        } catch { localStorage.removeItem(STATION_KEY); }
      }
      if (active[0]?.id) setWarehouseId(active[0].id);
    }).catch(() => triggerFeedback('error', '仓库数据加载失败'));
  }, []);

  useEffect(() => {
    if (!warehouseId) return;
    locationsApi.list(warehouseId).then((data) => {
      const active = data.filter((x) => x.status === 'ACTIVE');
      setLocations(active);
      setLocationId((current) => active.some((x) => x.id === current) ? current : (active[0]?.id || ''));
      resetSession();
    }).catch(() => setLocations([]));
  }, [warehouseId]);

  useEffect(() => { inputRef.current?.focus(); }, [mode, warehouseId, locationId, lines.length]);

  const beep = (ok: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = ok ? 880 : 220;
      gain.gain.value = 0.055;
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.start(); oscillator.stop(ctx.currentTime + (ok ? 0.06 : 0.18));
    } catch { /* visual feedback remains */ }
  };

  const resolveAvailable = async (item: Item) => {
    if (mode !== 'OUT') return undefined;
    const result = await inventoryApi.list({
      page: '1', pageSize: '100', search: item.itemCode,
      warehouseId, locationId,
    });
    const row = result.data.find((x) => x.itemId === item.id && x.locationId === locationId);
    return Number(row?.quantity || 0);
  };

  const handleScan = async () => {
    const code = scanValue.trim();
    setScanValue('');
    if (!code) return;
    if (!warehouseId || !locationId) {
      triggerFeedback('error', '请先选择仓库和库位'); beep(false); return;
    }
    if (isOperator && !stationLocked) {
      triggerFeedback('error', '仓管员必须先锁定当前工位'); beep(false); return;
    }

    try {
      const item = await itemsApi.resolveScan(code);
      const available = await resolveAvailable(item);
      const currentQty = lines.find((line) => line.item.id === item.id)?.quantity || 0;
      if (mode === 'OUT' && available !== undefined && currentQty + 1 > available) {
        triggerFeedback('error', `${item.itemCode} 库存不足：当前 ${available}，本次已扫 ${currentQty}`);
        beep(false);
        return;
      }

      setLines((current) => {
        const existing = current.find((line) => line.item.id === item.id);
        if (existing) {
          return current.map((line) => line.item.id === item.id
            ? { ...line, quantity: line.quantity + 1, available }
            : line);
        }
        return [{ item, quantity: 1, available }, ...current];
      });
      triggerFeedback('ok', `${item.itemCode} · ${item.itemName} +1`);
      beep(true);
    } catch (err: any) {
      triggerFeedback('error', err?.message || `未识别：${code}`);
      beep(false);
    } finally { requestAnimationFrame(() => inputRef.current?.focus()); }
  };

  const changeQty = (itemId: string, delta: number) => {
    setLines((current) => current.map((line) => {
      if (line.item.id !== itemId) return line;
      const next = line.quantity + delta;
      if (delta > 0 && mode === 'OUT' && line.available !== undefined && next > line.available) {
        triggerFeedback('warning', `${line.item.itemCode} 已达到当前可出库存 ${line.available}`);
        return line;
      }
      return { ...line, quantity: next };
    }).filter((line) => line.quantity > 0));
  };

  const undoLastScan = () => {
    if (!lines.length) return;
    const last = lines[0];
    changeQty(last.item.id, -1);
    triggerFeedback('warning', `已撤销上一扫：${last.item.itemCode} -1`);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const lockStation = () => {
    if (!warehouseId || !locationId) return;
    localStorage.setItem(STATION_KEY, JSON.stringify({ warehouseId, locationId }));
    setStationLocked(true);
    triggerFeedback('ok', '当前仓库与库位已锁定为本机工位');
  };

  const unlockStation = () => {
    if (lines.length && !window.confirm('本次已有扫描记录。解锁工位会清空当前扫描，是否继续？')) return;
    localStorage.removeItem(STATION_KEY);
    setStationLocked(false);
    resetSession();
    triggerFeedback('warning', '工位已解锁，请重新确认仓库和库位');
  };

  const submit = async () => {
    if (!lines.length || !warehouseId || !locationId || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        requestId: requestIdRef.current,
        warehouseId,
        remark: `仓库扫码工作台 · ${activeLocation?.locationCode || ''}`,
        items: lines.map((line) => ({
          itemId: line.item.id, locationId, quantity: line.quantity,
          unit: line.item.unit, remark: 'USB/HID 扫码',
        })),
      };
      if (mode === 'IN') await stockInApi.create({ ...payload, type: 'OTHER' });
      else await stockOutApi.create({ ...payload, type: 'SALES' });
      const submittedTotal = total;
      resetSession();
      triggerFeedback('ok', `${mode === 'IN' ? '入库' : '出库'}成功，共 ${submittedTotal} 件`);
      beep(true);
    } catch (err: any) {
      triggerFeedback('error', err?.message || '提交失败；可直接重试，系统会用同一请求号防止重复记账');
      beep(false);
    } finally { setSubmitting(false); requestAnimationFrame(() => inputRef.current?.focus()); }
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    if (lines.length && !window.confirm(`切换为${next === 'IN' ? '入库' : '出库'}会清空当前 ${total} 件扫描记录，是否继续？`)) return;
    setMode(next);
    resetSession();
    setMessageType('idle');
    setMessage('请扫描商品条码 / SKU 编码');
  };

  const scanPanelClass = flash === 'error'
    ? 'border-rose-600 bg-rose-100'
    : flash === 'ok'
      ? 'border-emerald-500 bg-emerald-100'
      : mode === 'IN'
        ? 'border-emerald-300 bg-emerald-50/50'
        : 'border-rose-300 bg-rose-50/50';

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">仓库扫码工作台</h1>
          <p className="text-sm text-slate-500 mt-1">扫码枪建议设置为 HID 键盘模式，并在每次扫码后自动回车。</p>
        </div>
        <div className="flex rounded-2xl bg-slate-100 p-1.5">
          <button onClick={() => switchMode('OUT')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${mode === 'OUT' ? 'bg-rose-600 text-white shadow' : 'text-slate-500'}`}><ArrowUpRight className="w-5 h-5" /> 出库模式</button>
          <button onClick={() => switchMode('IN')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${mode === 'IN' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500'}`}><ArrowDownLeft className="w-5 h-5" /> 入库模式</button>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${stationLocked ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-amber-300'}`}>
        {stationLocked ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs text-slate-400">当前固定工位</div>
                <div className="font-bold text-lg">{activeWarehouse?.warehouseName || '—'} · {activeLocation?.locationCode || '—'} {activeLocation?.locationName ? `· ${activeLocation.locationName}` : ''}</div>
              </div>
            </div>
            <button onClick={unlockStation} className="px-3 py-2 rounded-xl border border-slate-600 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-2"><Unlock className="w-4 h-4" /> 解锁工位</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-semibold"><AlertTriangle className="w-5 h-5" /> 首次使用请确认并锁定当前工位</div>
            <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <label className="text-sm font-medium text-slate-700">仓库<select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white">{warehouses.map((w) => <option key={w.id} value={w.id}>{w.warehouseName}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-700">库位<select value={locationId} onChange={(e) => { setLocationId(e.target.value); resetSession(); }} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white">{locations.map((l) => <option key={l.id} value={l.id}>{l.locationCode} - {l.locationName}</option>)}</select></label>
              <button onClick={lockStation} disabled={!warehouseId || !locationId} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"><Lock className="w-4 h-4" /> 锁定工位</button>
            </div>
          </div>
        )}
      </div>

      <div className={`rounded-3xl border-2 p-6 md:p-8 transition-colors duration-150 ${scanPanelClass}`}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${mode === 'IN' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}><ScanLine className="w-8 h-8" /></div>
            <div><div className="text-2xl font-black text-slate-900">{mode === 'IN' ? '入库扫码' : '出库扫码'}</div><div className="text-sm text-slate-500">每扫一次自动 +1</div></div>
          </div>
          <div className="text-right"><div className="text-xs text-slate-500">本次合计</div><div className="text-4xl font-black text-slate-900">{total}</div></div>
        </div>
        <input ref={inputRef} value={scanValue} onChange={(e) => setScanValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleScan(); } }} autoComplete="off" placeholder="扫描商品条码 / SKU" className="w-full px-5 py-5 text-2xl font-mono border-2 border-slate-300 rounded-2xl bg-white outline-none focus:border-slate-500 focus:ring-4 focus:ring-white/60" />
        <div className={`mt-4 min-h-7 text-lg font-bold ${messageType === 'ok' ? 'text-emerald-700' : messageType === 'error' ? 'text-rose-700' : messageType === 'warning' ? 'text-amber-700' : 'text-slate-500'}`}>{message}</div>
      </div>

      <div className="grid md:grid-cols-[1fr_auto] gap-3">
        <button onClick={undoLastScan} disabled={!lines.length || submitting} className="px-5 py-4 rounded-2xl bg-white border border-slate-200 font-semibold text-slate-700 flex items-center justify-center gap-2 disabled:opacity-40"><Undo2 className="w-5 h-5" /> 撤销上一扫</button>
        <button onClick={() => void submit()} disabled={!lines.length || submitting || !warehouseId || !locationId || (isOperator && !stationLocked)} className={`px-10 py-4 rounded-2xl text-white text-lg font-black flex items-center justify-center gap-2 disabled:opacity-40 ${mode === 'IN' ? 'bg-emerald-600' : 'bg-rose-600'}`}><CheckCircle2 className="w-6 h-6" />{submitting ? '提交中…' : `确认${mode === 'IN' ? '入库' : '出库'} ${total} 件`}</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"><div className="font-bold">本次扫描明细</div><div className="text-sm">SKU {lines.length} 种 · <span className="font-bold">{total}</span> 件</div></div>
        {lines.length === 0 ? <div className="py-14 text-center text-slate-400">等待扫码</div> : <div className="divide-y divide-slate-100">{lines.map((line) => <div key={line.item.id} className="px-5 py-4 flex items-center gap-4"><div className="flex-1 min-w-0"><div className="font-mono font-bold text-base">{line.item.itemCode}</div><div className="text-sm text-slate-500 truncate">{line.item.itemName}{line.item.color ? ` · ${line.item.color}` : ''}</div>{mode === 'OUT' && line.available !== undefined && <div className={`text-xs mt-1 ${line.quantity >= line.available ? 'text-amber-700 font-semibold' : 'text-slate-400'}`}>当前库存 {line.available} · 扫描后剩余 {line.available - line.quantity}</div>}</div><div className="flex items-center gap-2"><button onClick={() => changeQty(line.item.id, -1)} className="w-11 h-11 rounded-xl border text-xl">−</button><span className="w-14 text-center font-black text-xl">{line.quantity}</span><button onClick={() => changeQty(line.item.id, 1)} className="w-11 h-11 rounded-xl border text-xl">+</button></div><button onClick={() => setLines((c) => c.filter((x) => x.item.id !== line.item.id))} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-5 h-5" /></button></div>)}</div>}
        <div className="p-4 border-t border-slate-100 text-right"><button onClick={resetSession} disabled={!lines.length || submitting} className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:text-rose-600 disabled:opacity-40">清空本次扫描</button></div>
      </div>
    </div>
  );
}
