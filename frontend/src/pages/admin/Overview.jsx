import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart
} from 'recharts';
import { Briefcase, Building2, GraduationCap, Users } from 'lucide-react';
import client from '../../api/client';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';

const pieColors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#F43F5E', '#64748B', '#8B5CF6'];

export default function AdminOverview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get('/admin/overview').then((res) => setData(res.data));
  }, []);

  if (!data) return <Spinner />;
  const placedPct = data.placement.total_students
    ? Math.round((data.placement.placed / data.placement.total_students) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Placement control center</h1>
        <p className="mt-1 text-sm text-slate-500">{data.pendingRecruiters} recruiter registrations awaiting review.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={data.totals.students} icon={GraduationCap} />
        <StatCard label="Recruiters" value={data.totals.recruiters} icon={Users} />
        <StatCard label="Companies / jobs" value={`${data.totals.companies} / ${data.totals.jobs}`} icon={Building2} />
        <StatCard label="Placed students" value={data.totals.placed_students} hint={`${placedPct}% placement`} icon={Briefcase} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Applications over time</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={data.applicationsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Status distribution</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.statusDistribution} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80}>
                  {data.statusDistribution.map((_, index) => (
                    <Cell key={index} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Placements by department</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.placementsByDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4338CA" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Company-wise hiring</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.companyHiring}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="hired" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
