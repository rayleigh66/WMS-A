import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { locationsApi } from '../api/locations';
import { warehousesApi } from '../api/warehouses';
import type { Location, Warehouse } from '../types/api';
import { useAuth } from '../auth/AuthProvider';
import { canManageWarehouse } from '../auth/role';
import { Loading, ErrorAlert } from '../components/ui/Alerts';

export default function LocationsPage() {
  const { user } = useAuth();
  const role = user?.role || 'VIEWER';
  const canEdit = canManageWarehouse(role);
  const [data, setData] = useState<Location[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [whFilter, setWhFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [whId, setWhId] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      locationsApi.list(whFilter || undefined),
      warehousesApi.list(),
    ]).then(([locs, whs]) => { setData(locs); setWarehouses(whs); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [whFilter]);

  const openCreate = () => { setEditId(null); setCode(''); setName(''); setWhId(warehouses[0]?.id || ''); setFormOpen(true); };
  const openEdit = (loc: Location) => { setEditId(loc.id); setCode(loc.locationCode); setName(loc.locationName); setWhId(loc.warehouseId); setFormOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) await locationsApi.update(editId, { locationCode: code, locationName: name, warehouseId: whId } as any);
      else await locationsApi.create({ locationCode: code, locationName: name, warehouseId: whId } as any);
      setFormOpen(false);
      load();
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认停用此库位？')) return;
    try { await locationsApi.remove(id); load(); } catch (err: any) { setError(err.message); }
  };

  const getWhName = (id: string) => warehouses.find((w) => w.id === id)?.warehouseName || id;

  if (loading) return <Loading />;
  if (error) return <ErrorAlert message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={whFilter} onChange={(e) => setWhFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">全部仓库</option>
          {warehouses.map((w) => (<option key={w.id} value={w.id}>{w.warehouseName}</option>))}
        </select>
        {canEdit && <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"><Plus className="w-4 h-4" /> 新增库位</button>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">库位编码</th><th className="text-left px-4 py-3">库位名称</th><th className="text-left px-4 py-3">所属仓库</th><th className="text-center px-4 py-3">状态</th><th className="text-right px-4 py-3">操作</th>
            </tr></thead>
            <tbody>
              {data.map((loc) => (
                <tr key={loc.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{loc.locationCode}</td>
                  <td className="px-4 py-3">{loc.locationName}</td>
                  <td className="px-4 py-3 text-gray-600">{getWhName(loc.warehouseId)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${loc.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{loc.status === 'ACTIVE' ? '启用' : '停用'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && <><button onClick={() => openEdit(loc)} className="text-gray-400 hover:text-emerald-600 mr-2"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDelete(loc.id)} className="text-gray-400 hover:text-red-600 text-xs">停用</button></>}
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无库位</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setFormOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-lg">{editId ? '编辑库位' : '新增库位'}</h3></div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">所属仓库 *</label><select value={whId} onChange={(e) => setWhId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{warehouses.map((w) => (<option key={w.id} value={w.id}>{w.warehouseName}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">库位编码 *</label><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="A01-01-01" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">库位名称 *</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="A区01排1层01位" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">取消</button><button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">保存</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
