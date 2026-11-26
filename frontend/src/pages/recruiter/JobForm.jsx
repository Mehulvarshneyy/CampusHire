import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';

const blank = {
  title: '',
  description: '',
  responsibilities: '',
  requiredSkills: '',
  location: '',
  employmentType: 'FULL_TIME',
  salaryMin: '',
  salaryMax: '',
  minCgpa: '7',
  eligibleDepartments: 'Computer Science, Information Technology',
  eligibleGraduationYears: '2025, 2026',
  applicationDeadline: '',
  openings: 1
};

export default function JobForm() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    client.get(`/jobs/${id}`).then((res) => {
      const job = res.data.job;
      setForm({
        title: job.title,
        description: job.description,
        responsibilities: job.responsibilities || '',
        requiredSkills: (job.required_skills || []).join(', '),
        location: job.location,
        employmentType: job.employment_type,
        salaryMin: job.salary_min || '',
        salaryMax: job.salary_max || '',
        minCgpa: job.min_cgpa,
        eligibleDepartments: (job.eligible_departments || []).join(', '),
        eligibleGraduationYears: (job.eligible_graduation_years || []).join(', '),
        applicationDeadline: job.application_deadline?.slice(0, 16) || '',
        openings: job.openings
      });
    });
  }, [id]);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      applicationDeadline: new Date(form.applicationDeadline).toISOString()
    };
    try {
      if (id) await client.put(`/jobs/${id}`, payload);
      else await client.post('/jobs', payload);
      toast.push(id ? 'Job updated' : 'Job published');
      navigate('/recruiter/jobs');
    } catch (error) {
      toast.push(error.response?.data?.message || 'Unable to save job', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card max-w-3xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{id ? 'Edit job' : 'Create job'}</h1>
        <p className="mt-1 text-sm text-slate-500">Company details are taken from your recruiter profile.</p>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Job title
        <input className="input mt-1.5" required value={form.title} onChange={(e) => set('title', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Description
        <textarea className="input mt-1.5 min-h-28" required value={form.description} onChange={(e) => set('description', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Responsibilities
        <textarea className="input mt-1.5 min-h-24" value={form.responsibilities} onChange={(e) => set('responsibilities', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Required skills
        <input className="input mt-1.5" placeholder="React, Node.js, SQL" value={form.requiredSkills} onChange={(e) => set('requiredSkills', e.target.value)} />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Location
          <input className="input mt-1.5" required value={form.location} onChange={(e) => set('location', e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Employment type
          <select className="input mt-1.5" value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
            <option value="FULL_TIME">Full-time</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="CONTRACT">Contract</option>
            <option value="PART_TIME">Part-time</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Salary / CTC min
          <input className="input mt-1.5" value={form.salaryMin} onChange={(e) => set('salaryMin', e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Salary / CTC max
          <input className="input mt-1.5" value={form.salaryMax} onChange={(e) => set('salaryMax', e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Minimum CGPA
          <input className="input mt-1.5" value={form.minCgpa} onChange={(e) => set('minCgpa', e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Openings
          <input className="input mt-1.5" type="number" min="1" value={form.openings} onChange={(e) => set('openings', e.target.value)} />
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Eligible departments
        <input className="input mt-1.5" value={form.eligibleDepartments} onChange={(e) => set('eligibleDepartments', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Eligible graduation years
        <input className="input mt-1.5" value={form.eligibleGraduationYears} onChange={(e) => set('eligibleGraduationYears', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Application deadline
        <input className="input mt-1.5" type="datetime-local" required value={form.applicationDeadline} onChange={(e) => set('applicationDeadline', e.target.value)} />
      </label>
      <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save job'}</button>
    </form>
  );
}
