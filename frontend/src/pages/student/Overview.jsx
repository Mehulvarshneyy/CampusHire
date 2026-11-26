import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import client from '../../api/client';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/format';

export default function StudentOverview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get('/students/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {data.profile.full_name}</h1>
        <p className="mt-1 text-sm text-slate-500">Track applications, eligibility, and new campus roles.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total applications" value={data.stats.total} icon={Briefcase} />
        <StatCard label="Pending" value={data.stats.pending} icon={Clock3} />
        <StatCard label="Shortlisted" value={data.stats.shortlisted} icon={CheckCircle2} />
        <StatCard label="Rejected" value={data.stats.rejected} icon={XCircle} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recently posted jobs</h2>
            <Link to="/student/jobs" className="text-sm text-brand-600">
              Browse all
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentJobs.length === 0 ? (
              <p className="text-sm text-slate-500">No open jobs right now.</p>
            ) : (
              data.recentJobs.map((job) => (
                <Link key={job.id} to={`/student/jobs/${job.id}`} className="block rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-slate-500">
                    {job.company_name} · {job.location} · Deadline {formatDate(job.application_deadline)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Application activity</h2>
          <div className="space-y-3">
            {data.activity.length === 0 ? (
              <p className="text-sm text-slate-500">No applications yet.</p>
            ) : (
              data.activity.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.company_name}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
