import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import { employmentLabel, formatDate, formatSalary } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

export default function JobDetail() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get(`/jobs/${id}`).then((res) => setPayload(res.data));
  }, [id]);

  if (!payload) return <Spinner />;
  const { job, applied, eligible } = payload;

  async function apply() {
    setSubmitting(true);
    try {
      await client.post(`/jobs/${id}/apply`, { coverLetter });
      toast.push('Application submitted');
      navigate('/student/applications');
    } catch (error) {
      toast.push(error.response?.data?.message || 'Could not apply', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <article className="card space-y-6 p-6">
        <div>
          <p className="text-sm text-slate-500">{job.company_name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{job.title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {job.location} · {employmentLabel(job.employment_type)} · {formatSalary(job.salary_min, job.salary_max)}
          </p>
        </div>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Company</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{job.company_description || 'Campus recruiting partner.'}</p>
        </section>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{job.description}</p>
        </section>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Responsibilities</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{job.responsibilities}</p>
        </section>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Required qualifications</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(job.required_skills || []).map((skill) => (
              <span key={skill} className="badge bg-slate-100 text-slate-700">{skill}</span>
            ))}
          </div>
        </section>
      </article>
      <aside className="card h-fit space-y-4 p-5">
        <div>
          <p className="text-sm text-slate-500">Deadline</p>
          <p className="font-medium">{formatDate(job.application_deadline)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Eligibility</p>
          <p className="text-sm text-slate-700">Min CGPA {job.min_cgpa}</p>
          <p className="text-sm text-slate-700">
            {(job.eligible_departments || []).join(', ') || 'All departments'}
          </p>
          <p className="text-sm text-slate-700">
            Years {(job.eligible_graduation_years || []).join(', ') || 'All'}
          </p>
        </div>
        {applied ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">You have already applied.</p>
        ) : (
          <>
            <textarea className="input min-h-28" placeholder="Optional note for the recruiter" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
            <button className="btn-primary w-full" disabled={!eligible || submitting} onClick={apply}>
              {eligible ? (submitting ? 'Submitting…' : 'Apply now') : 'Not eligible'}
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
