import { useEffect, useState } from 'react';
import client from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';

export default function RecruiterProfile() {
  const toast = useToast();
  const [form, setForm] = useState(null);

  useEffect(() => {
    client.get('/recruiters/dashboard').then((res) => {
      const r = res.data.recruiter;
      setForm({
        fullName: r.full_name || '',
        phone: r.phone || '',
        designation: r.designation || '',
        companyName: r.company_name || '',
        industry: r.industry || '',
        companyLocation: r.company_location || '',
        website: r.website || '',
        companyDescription: r.description || r.company_description || ''
      });
    });
  }, []);

  if (!form) return <Spinner />;

  async function save(event) {
    event.preventDefault();
    try {
      await client.put('/recruiters/profile', form);
      toast.push('Profile saved');
    } catch (error) {
      toast.push(error.response?.data?.message || 'Save failed', 'error');
    }
  }

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form onSubmit={save} className="card max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Company profile</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="input" placeholder="Your name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <input className="input" placeholder="Designation" value={form.designation} onChange={(e) => set('designation', e.target.value)} />
        <input className="input" placeholder="Company name" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
        <input className="input" placeholder="Industry" value={form.industry} onChange={(e) => set('industry', e.target.value)} />
        <input className="input" placeholder="Company location" value={form.companyLocation} onChange={(e) => set('companyLocation', e.target.value)} />
      </div>
      <input className="input" placeholder="Website" value={form.website} onChange={(e) => set('website', e.target.value)} />
      <textarea className="input min-h-24" placeholder="Company description" value={form.companyDescription} onChange={(e) => set('companyDescription', e.target.value)} />
      <button className="btn-primary">Save profile</button>
    </form>
  );
}
