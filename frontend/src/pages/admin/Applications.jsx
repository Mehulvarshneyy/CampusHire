import { useEffect, useState } from 'react';
import client from '../../api/client';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../lib/format';

export default function AdminApplications() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get('/admin/applications', { params: { status, page, limit: 12 } }).then((res) => setData(res.data));
  }, [status, page]);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Application activity</h1>
        <select className="input w-48" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {['APPLIED','UNDER_REVIEW','SHORTLISTED','INTERVIEW_SCHEDULED','SELECTED','REJECTED','WITHDRAWN'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Job</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((app) => (
              <tr key={app.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{app.student_name}</td>
                <td className="px-4 py-3">{app.title}</td>
                <td className="px-4 py-3">{app.company_name}</td>
                <td className="px-4 py-3">{formatDate(app.created_at)}</td>
                <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={data.pagination} onPage={setPage} />
    </div>
  );
}
