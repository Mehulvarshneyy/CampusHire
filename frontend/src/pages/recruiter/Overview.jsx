import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, Users, UserCheck } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import client from '../../api/client';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/format';

export default function RecruiterOverview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get('/recruiters/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      {data.recruiter.approval_status !== 'APPROVED' ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your recruiter account is {data.recruiter.approval_status.toLowerCase()}. Job publishing unlocks after admin approval.
        </div>
      ) : null}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Recruitment overview</h1>
        <p className="mt-1 text-sm text-slate-500">{data.recruiter.company_name || 'Complete your company profile to publish jobs.'}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active jobs" value={data.stats.active_jobs} icon={Briefcase} />
        <StatCard label="Total applicants" value={data.stats.total_applicants} icon={Users} />
        <StatCard label="Shortlisted" value={data.stats.shortlisted} icon={UserCheck} />
        <StatCard label="Selected" value={data.stats.selected} icon={CheckCircle2} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Recruitment activity</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.activity}>
                <XAxis dataKey="day" hide />
                <YAxis allowDecimals={false} width={28} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#4F46E5" fill="#EEF2FF" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent applications</h2>
            <Link to="/recruiter/jobs" className="text-sm text-brand-600">Manage jobs</Link>
          </div>
          <div className="space-y-3">
            {data.recentApplications.length === 0 ? (
              <p className="text-sm text-slate-500">No applications yet.</p>
            ) : (
              data.recentApplications.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div>
                    <p className="text-sm font-medium">{item.full_name}</p>
                    <p className="text-xs text-slate-500">{item.title} · {formatDate(item.created_at)}</p>
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
