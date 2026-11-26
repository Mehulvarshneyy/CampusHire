import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { homeFor, useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState('STUDENT');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    college: '',
    department: '',
    graduationYear: '2026',
    cgpa: '',
    companyName: '',
    designation: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      toast.push(role === 'RECRUITER' ? 'Account created. Await admin approval.' : 'Account created');
      navigate(homeFor(user.role));
    } catch (error) {
      toast.push(error.response?.data?.message || 'Unable to register', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-10">
      <form onSubmit={submit} className="card w-full space-y-4 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="text-brand-600">
              Sign in
            </Link>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {['STUDENT', 'RECRUITER'].map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setRole(value)}
              className={`rounded-lg py-2 text-sm ${role === value ? 'bg-white font-medium shadow-sm' : 'text-slate-500'}`}
            >
              {value === 'STUDENT' ? 'Student' : 'Recruiter'}
            </button>
          ))}
        </div>
        <input className="input" placeholder="Full name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
        <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />
        {role === 'STUDENT' ? (
          <>
            <input className="input" placeholder="College" value={form.college} onChange={(e) => set('college', e.target.value)} />
            <div className="grid gap-3 md:grid-cols-3">
              <input className="input" placeholder="Department" value={form.department} onChange={(e) => set('department', e.target.value)} />
              <input className="input" placeholder="Graduation year" value={form.graduationYear} onChange={(e) => set('graduationYear', e.target.value)} />
              <input className="input" placeholder="CGPA" value={form.cgpa} onChange={(e) => set('cgpa', e.target.value)} />
            </div>
          </>
        ) : (
          <>
            <input className="input" placeholder="Company name" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
            <input className="input" placeholder="Designation" value={form.designation} onChange={(e) => set('designation', e.target.value)} />
            <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </>
        )}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
