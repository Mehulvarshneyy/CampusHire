import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../lib/format';

export default function StudentApplications() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get('/students/applications', { params: { page, status, limit: 10 } }).then((res) => setData(res.data));
  }, [page, status]);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My applications</h1>
          <p className="mt-1 text-sm text-slate-500">Follow every status change from applied to selected.</p>
        </div>
        <select className="input w-48" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {['APPLIED','UNDER_REVIEW','SHORTLISTED','INTERVIEW_SCHEDULED','SELECTED','REJECTED','WITHDRAWN'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      {!data.items.length ? (
        <EmptyState title="No applications yet" description="Browse open jobs and submit your first application." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Applied</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((app) => (
                <tr key={app.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{app.company_name}</td>
                  <td className="px-4 py-3">{app.title}</td>
                  <td className="px-4 py-3">{formatDate(app.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                  <td className="px-4 py-3">{formatDate(app.updated_at)}</td>
                  <td className="px-4 py-3">
                    <Link className="text-brand-600" to={`/student/applications/${app.id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={data.pagination} onPage={setPage} />
    </div>
  );
}
