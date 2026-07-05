import { useState, useEffect } from 'react';
import { Plus, Pencil, Search } from 'lucide-react';
import { itemsApi } from '../api/items';
import type { Item, PaginatedResponse, ItemCategory } from '../types/api';
import { CATEGORY_LABELS } from '../types/api';
import { useAuth } from '../auth/AuthProvider';
import { canWrite } from '../auth/role';
import { Loading, ErrorAlert } from '../components/ui/Alerts';
import { Pagination } from '../components/ui/Pagination';

const EMPTY_FORM = { itemCode: '', itemName: '', category: 'OTHER' as ItemCategory, specification: '', color: '', unit: '', supplier: '', safetyStock: 0, remark: '' };

export default function ItemsPage() {
  const { user } = useAuth();
  const role = user?.role || 'VIEWER';
  const [data, setData] = useState<PaginatedResponse<Item> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    itemsApi.list({ page: String(page), pageSize: '20', search: search || undefined, category: category || undefined })
      .then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, [page, category]);

  const handleSearch = () => { setPage(1); load(); };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditId(item.id);
    setForm({ itemCode: item.itemCode, itemName: item.itemName, category: item.category, specification: item.specification || '', color: item.color || '', unit: item.unit, supplier: item.supplier || '', safetyStock: Number(item.safetyStock), remark: item.remark || '' });
    setFormError('');
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemCode || !form.itemName || !form.unit) { setFormError('请填写必填字段'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (editId) {
        await itemsApi.update(editId, form);
      } else {
        await itemsApi.create(form);
      }
      setFormOpen(false);
      load();
    } catch (err: any) {
      setFormError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认停用/删除此物料？')) return;
    try {
      await itemsApi.remove(id);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="搜索物料编码/名称..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">全部分类</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        {canWrite(role) && (
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> 新增物料
          </button>
        )}
      </div>

      {error && <ErrorAlert message={error} onRetry={load} />}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">编码</th><th className="text-left px-4 py-3">名称</th><th className="text-left px-4 py-3">分类</th>
              <th className="text-left px-4 py-3">规格</th><th className="text-left px-4 py-3">单位</th><th className="text-right px-4 py-3">安全库存</th>
              <th className="text-center px-4 py-3">状态</th><th className="text-right px-4 py-3">操作</th>
            </tr></thead>
            <tbody>
              {data?.data.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{item.itemCode}</td>
                  <td className="px-4 py-3 font-medium">{item.itemName}</td>
                  <td className="px-4 py-3 text-gray-600">{CATEGORY_LABELS[item.category] || item.category}</td>
                  <td className="px-4 py-3 text-gray-500">{item.specification || '-'}</td>
                  <td className="px-4 py-3">{item.unit}</td>
                  <td className="px-4 py-3 text-right">{Number(item.safetyStock)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.status === 'ACTIVE' ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canWrite(role) && <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-emerald-600"><Pencil className="w-4 h-4" /></button>}
                      {canWrite(role) && <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 text-xs">停用</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {(!data?.data || data.data.length === 0) && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">{loading ? '加载中...' : '暂无物料数据'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data && <div className="px-4 py-3 border-t border-gray-100"><Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} /></div>}
      </div>
      {loading && <Loading />}

      {/* Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setFormOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-lg">{editId ? '编辑物料' : '新增物料'}</h3></div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">编码 *</label><input value={form.itemCode} onChange={(e) => setForm({ ...form, itemCode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label><input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">分类</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ItemCategory })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">{Object.entries(CATEGORY_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">单位 *</label><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">规格</label><input value={form.specification} onChange={(e) => setForm({ ...form, specification: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">颜色</label><input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">供应商</label><input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">安全库存</label><input type="number" value={form.safetyStock} onChange={(e) => setForm({ ...form, safetyStock: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">备注</label><textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">取消</button><button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:bg-emerald-400">{saving ? '保存中...' : '保存'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
