import { useEffect, useState } from 'react';
import client from '../../api/client';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';

export default function AdminUsers() {
  const toast = useToast();
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  async function load() {
    const res = await client.get('/admin/users', { params: { role, search, page, limit: 12 } });
    setData(res.data);
  }

  useEffect(() => {
    load();
  }, [role, search, page]);

  if (!data) return <Spinner />;

  async function toggle(user) {
    await client.patch(`/admin/users/${user.id}/active`, { isActive: !user.is_active });
    toast.push(user.is_active ? 'Account deactivated' : 'Account activated');
    load();
  }

  async function review(user, status) {
    await client.patch(`/admin/recruiters/${user.id}/review`, { status });
    toast.push(`Recruiter ${status.toLowerCase()}`);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search users" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
        <select className="input w-40" value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }}>
          <option value="">All roles</option>
          <option value="STUDENT">Students</option>
          <option value="RECRUITER">Recruiters</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>
      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-xs text-slate-400">{user.email} {user.company_name ? `· ${user.company_name}` : ''}</p>
                </td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">
                  {user.approval_status ? <StatusBadge status={user.approval_status} /> : <StatusBadge status={user.is_active ? 'APPROVED' : 'CLOSED'} />}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {user.role !== 'ADMIN' ? (
                      <button className="text-slate-600" onClick={() => toggle(user)}>
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    ) : null}
                    {user.role === 'RECRUITER' && user.approval_status === 'PENDING' ? (
                      <>
                        <button className="text-emerald-600" onClick={() => review(user, 'APPROVED')}>Approve</button>
                        <button className="text-rose-600" onClick={() => review(user, 'REJECTED')}>Reject</button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={data.pagination} onPage={setPage} />
    </div>
  );
}
