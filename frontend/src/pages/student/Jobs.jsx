import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { employmentLabel, formatDate, formatSalary } from '../../lib/format';

const emptyFilters = {
  search: '',
  location: '',
  employmentType: '',
  company: '',
  minSalary: '',
  eligible: false,
  sort: 'newest'
};

export default function StudentJobs() {
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = { page, limit: 8, sort: filters.sort === 'deadline' ? 'deadline' : 'newest' };
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'sort') params[key] = value;
    });
    setLoading(true);
    client
      .get('/jobs', { params })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [filters, page]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Browse jobs</h1>
        <p className="mt-1 text-sm text-slate-500">Search open campus roles and filter by eligibility.</p>
      </div>
      <div className="card grid gap-3 p-4 md:grid-cols-3 lg:grid-cols-6">
        <input className="input lg:col-span-2" placeholder="Search title or company" value={filters.search} onChange={(e) => { setPage(1); setFilters({ ...filters, search: e.target.value }); }} />
        <input className="input" placeholder="Location" value={filters.location} onChange={(e) => { setPage(1); setFilters({ ...filters, location: e.target.value }); }} />
        <select className="input" value={filters.employmentType} onChange={(e) => { setPage(1); setFilters({ ...filters, employmentType: e.target.value }); }}>
          <option value="">All types</option>
          <option value="FULL_TIME">Full-time</option>
          <option value="INTERNSHIP">Internship</option>
          <option value="CONTRACT">Contract</option>
          <option value="PART_TIME">Part-time</option>
        </select>
        <input className="input" placeholder="Company" value={filters.company} onChange={(e) => { setPage(1); setFilters({ ...filters, company: e.target.value }); }} />
        <input className="input" placeholder="Min CTC" value={filters.minSalary} onChange={(e) => { setPage(1); setFilters({ ...filters, minSalary: e.target.value }); }} />
        <select className="input" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
          <option value="newest">Newest</option>
          <option value="deadline">Deadline</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={filters.eligible} onChange={(e) => { setPage(1); setFilters({ ...filters, eligible: e.target.checked }); }} />
          Eligible only
        </label>
      </div>
      {loading ? (
        <Spinner />
      ) : !data?.items?.length ? (
        <EmptyState title="No jobs found" description="Try clearing filters or check back after new listings are published." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {data.items.map((job) => (
              <Link key={job.id} to={`/student/jobs/${job.id}`} className="card p-5 hover:border-slate-300">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{job.title}</h2>
                    <p className="text-sm text-slate-500">{job.company_name}</p>
                  </div>
                  <span className="badge bg-slate-100 text-slate-600">{employmentLabel(job.employment_type)}</span>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {job.location} · {formatSalary(job.salary_min, job.salary_max)}
                </p>
                <p className="mt-2 text-sm text-slate-500">Min CGPA {job.min_cgpa} · Deadline {formatDate(job.application_deadline)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(job.required_skills || []).slice(0, 4).map((skill) => (
                    <span key={skill} className="badge bg-brand-50 text-brand-700">{skill}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
          <Pagination pagination={data.pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}
