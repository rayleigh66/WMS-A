import { useState, useEffect } from 'react';
import { Plus, Pencil, Search } from 'lucide-react';
import { usersApi } from '../api/users';
import type { User, PaginatedResponse } from '../types/api';
import { ROLE_LABELS } from '../types/api';
import { Loading, ErrorAlert } from '../components/ui/Alerts';
import { Pagination } from '../components/ui/Pagination';
import { ApiError } from '../api/client';

export default function UsersPage() {
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'VIEWER', department: 'OTHER' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    usersApi.list({ page: String(page), pageSize: '20', search: search || undefined })
      .then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  const handleSearch = () => { setPage(1); load(); };

  const openCreate = () => { setEditId(null); setForm({ email: '', name: '', password: '', role: 'VIEWER', department: 'OTHER' }); setFormOpen(true); };
  const openEdit = (u: User) => { setEditId(u.id); setForm({ email: u.email, name: u.name, password: '', role: u.role, department: u.department || 'OTHER' }); setFormOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { setFormError('请填写必填字段'); return; }
    if (!editId && !form.password) { setFormError('新建用户必须设置密码'); return; }
    setSaving(true); setFormError('');
    try {
      if (editId) {
        const payload: any = { name: form.name, role: form.role, department: form.department };
        if (form.password) payload.password = form.password;
        await usersApi.update(editId, payload);
      } else {
        await usersApi.create(form);
      }
      setFormOpen(false); load();
    } catch (err: any) { setFormError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认禁用此用户？')) return;
    try { await usersApi.remove(id); load(); } catch (err: any) { setError(err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="搜索用户..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"><Plus className="w-4 h-4" /> 新增用户</button>
      </div>
      {error && <ErrorAlert message={error} onRetry={load} />}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <th className="text-left px-4 py-3">姓名</th><th className="text-left px-4 py-3">邮箱</th><th className="text-left px-4 py-3">角色</th><th className="text-left px-4 py-3">部门</th><th className="text-center px-4 py-3">状态</th><th className="text-right px-4 py-3">操作</th>
          </tr></thead>
          <tbody>
            {data?.data.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{ROLE_LABELS[u.role] || u.role}</span></td>
                <td className="px-4 py-3 text-gray-500">{u.department || '-'}</td>
                <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{u.status === 'ACTIVE' ? '正常' : '禁用'}</span></td>
                <td className="px-4 py-3 text-right"><button onClick={() => openEdit(u)} className="text-gray-400 hover:text-emerald-600 mr-2"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDelete(u.id)} className="text-gray-400 hover:text-red-600 text-xs">禁用</button></td>
              </tr>
            ))}
            {(!data?.data || data.data.length === 0) && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无用户</td></tr>}
          </tbody>
        </table>
        {data && <div className="px-4 py-3 border-t"><Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} /></div>}
      </div>
      {loading && <Loading />}

      {formOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setFormOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b"><h3 className="font-bold">{editId ? '编辑用户' : '新增用户'}</h3></div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{formError}</div>}
              <div><label className="block text-sm font-medium mb-1">姓名 *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">邮箱 *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">{editId ? '新密码（留空不修改）' : '密码 *'}</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">角色</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{Object.entries(ROLE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></div>
                <div><label className="block text-sm font-medium mb-1">部门</label><select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="WAREHOUSE">仓库</option><option value="PURCHASING">采购</option><option value="PMC">生管</option><option value="FINANCE">财务</option><option value="ADMIN">管理</option><option value="OTHER">其他</option></select></div>
              </div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 border rounded-lg text-sm">取消</button><button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium">{saving ? '保存中...' : '保存'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
