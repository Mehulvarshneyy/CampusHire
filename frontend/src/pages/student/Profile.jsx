import { useEffect, useState } from 'react';
import client from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';

export default function StudentProfile() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client.get('/students/profile').then((res) => {
      const p = res.data.profile;
      setForm({
        fullName: p.full_name || '',
        phone: p.phone || '',
        college: p.college || '',
        department: p.department || '',
        graduationYear: p.graduation_year || '',
        cgpa: p.cgpa || '',
        skills: (p.skills || []).join(', '),
        resumeUrl: p.resume_url || '',
        linkedinUrl: p.linkedin_url || '',
        githubUrl: p.github_url || '',
        email: p.email
      });
    });
  }, []);

  if (!form) return <Spinner />;

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await client.put('/students/profile', form);
      toast.push('Profile updated');
    } catch (error) {
      toast.push(error.response?.data?.message || 'Could not save profile', 'error');
    } finally {
      setSaving(false);
    }
  }

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form onSubmit={save} className="card max-w-3xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Student profile</h1>
        <p className="mt-1 text-sm text-slate-500">This information is used for eligibility and recruiter review.</p>
      </div>
      <input className="input bg-slate-50" value={form.email} disabled />
      <div className="grid gap-3 md:grid-cols-2">
        <input className="input" placeholder="Full name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <input className="input" placeholder="College" value={form.college} onChange={(e) => set('college', e.target.value)} />
        <input className="input" placeholder="Department" value={form.department} onChange={(e) => set('department', e.target.value)} />
        <input className="input" placeholder="Graduation year" value={form.graduationYear} onChange={(e) => set('graduationYear', e.target.value)} />
        <input className="input" placeholder="CGPA" value={form.cgpa} onChange={(e) => set('cgpa', e.target.value)} />
      </div>
      <input className="input" placeholder="Skills, comma separated" value={form.skills} onChange={(e) => set('skills', e.target.value)} />
      <input className="input" placeholder="Resume URL" value={form.resumeUrl} onChange={(e) => set('resumeUrl', e.target.value)} />
      <input className="input" placeholder="LinkedIn URL" value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} />
      <input className="input" placeholder="GitHub URL" value={form.githubUrl} onChange={(e) => set('githubUrl', e.target.value)} />
      <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
    </form>
  );
}
