import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { warehousesApi } from '../api/warehouses';
import type { Warehouse } from '../types/api';
import { useAuth } from '../auth/AuthProvider';
import { canManageWarehouse } from '../auth/role';
import { Loading, ErrorAlert } from '../components/ui/Alerts';

export default function WarehousesPage() {
  const { user } = useAuth();
  const role = user?.role || 'VIEWER';
  const canEdit = canManageWarehouse(role);
  const [data, setData] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [remark, setRemark] = useState('');

  const load = () => {
    setLoading(true);
    warehousesApi.list().then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditId(null); setCode(''); setName(''); setRemark(''); setFormOpen(true); };
  const openEdit = (w: Warehouse) => { setEditId(w.id); setCode(w.warehouseCode); setName(w.warehouseName); setRemark(w.remark || ''); setFormOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) await warehousesApi.update(editId, { warehouseCode: code, warehouseName: name, remark });
      else await warehousesApi.create({ warehouseCode: code, warehouseName: name, remark });
      setFormOpen(false);
      load();
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认停用此仓库？')) return;
    try { await warehousesApi.remove(id); load(); } catch (err: any) { setError(err.message); }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorAlert message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      {canEdit && <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"><Plus className="w-4 h-4" /> 新增仓库</button>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((w) => (
          <div key={w.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold">{w.warehouseName}</div>
                <div className="text-xs text-gray-400 font-mono">{w.warehouseCode}</div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${w.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{w.status === 'ACTIVE' ? '启用' : '停用'}</span>
            </div>
            {w.remark && <div className="text-xs text-gray-500 mb-3">{w.remark}</div>}
            <div className="text-xs text-gray-400">{w.locations?.length || 0} 个库位</div>
            {canEdit && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(w)} className="text-xs text-emerald-600 hover:underline"><Pencil className="w-3.5 h-3.5 inline" /> 编辑</button>
                <button onClick={() => handleDelete(w.id)} className="text-xs text-red-500 hover:underline">停用</button>
              </div>
            )}
          </div>
        ))}
        {data.length === 0 && <div className="col-span-full text-center py-8 text-gray-400">暂无仓库</div>}
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setFormOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-lg">{editId ? '编辑仓库' : '新增仓库'}</h3></div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">仓库编码 *</label><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="RAW-MAT" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">仓库名称 *</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="原料仓" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">备注</label><textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">取消</button><button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">保存</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
