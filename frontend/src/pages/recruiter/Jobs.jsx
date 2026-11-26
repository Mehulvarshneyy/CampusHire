import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

export default function RecruiterJobs() {
  const toast = useToast();
  const [jobs, setJobs] = useState(null);

  async function load() {
    const res = await client.get('/jobs/mine');
    setJobs(res.data.jobs);
  }

  useEffect(() => {
    load();
  }, []);

  if (!jobs) return <Spinner />;

  async function closeJob(id) {
    try {
      await client.patch(`/jobs/${id}/close`);
      toast.push('Job closed');
      load();
    } catch (error) {
      toast.push(error.response?.data?.message || 'Unable to close job', 'error');
    }
  }

  async function removeJob(id) {
    try {
      const res = await client.delete(`/jobs/${id}`);
      toast.push(res.data.closed ? res.data.message : 'Job deleted');
      load();
    } catch (error) {
      toast.push(error.response?.data?.message || 'Unable to delete job', 'error');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job listings</h1>
          <p className="mt-1 text-sm text-slate-500">Create, edit, and review applicants for your campus roles.</p>
        </div>
        <Link to="/recruiter/jobs/new" className="btn-primary">New job</Link>
      </div>
      {!jobs.length ? (
        <EmptyState title="No jobs yet" description="Publish your first role after admin approval." action={<Link className="btn-primary" to="/recruiter/jobs/new">Create job</Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">Applicants</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-xs text-slate-400">{job.location}</p>
                  </td>
                  <td className="px-4 py-3">{formatDate(job.application_deadline)}</td>
                  <td className="px-4 py-3">{job.applicant_count}</td>
                  <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link className="text-brand-600" to={`/recruiter/jobs/${job.id}/applicants`}>Applicants</Link>
                      <Link className="text-slate-600" to={`/recruiter/jobs/${job.id}/edit`}>Edit</Link>
                      {job.status === 'OPEN' ? (
                        <button className="text-rose-600" onClick={() => closeJob(job.id)}>Close</button>
                      ) : null}
                      <button className="text-slate-500" onClick={() => removeJob(job.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
