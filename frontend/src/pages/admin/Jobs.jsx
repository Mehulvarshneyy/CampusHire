import { useEffect, useState } from 'react';
import client from '../../api/client';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

export default function AdminJobs() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  async function load() {
    const res = await client.get('/admin/jobs', { params: { search, page, limit: 10 } });
    setData(res.data);
  }

  useEffect(() => {
    load();
  }, [search, page]);

  if (!data) return <Spinner />;

  async function closeJob(id) {
    await client.patch(`/admin/jobs/${id}/close`);
    toast.push('Listing closed');
    load();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">All job listings</h1>
      <input className="input max-w-sm" placeholder="Search jobs" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Job</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Deadline</th>
              <th className="px-4 py-3 font-medium">Applicants</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((job) => (
              <tr key={job.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{job.title}</td>
                <td className="px-4 py-3">{job.company_name}</td>
                <td className="px-4 py-3">{formatDate(job.application_deadline)}</td>
                <td className="px-4 py-3">{job.applicant_count}</td>
                <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                <td className="px-4 py-3">
                  {job.status === 'OPEN' ? (
                    <button className="text-rose-600" onClick={() => closeJob(job.id)}>Close</button>
                  ) : null}
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
