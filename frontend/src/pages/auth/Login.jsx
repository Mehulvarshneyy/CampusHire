import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { homeFor, useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const demos = [
  { role: 'Student', email: 'student@university.edu', password: 'Student@123' },
  { role: 'Recruiter', email: 'recruiter@technova.com', password: 'Recruiter@123' },
  { role: 'Admin', email: 'admin@campushire.edu', password: 'Admin@123' }
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.push('Welcome back');
      navigate(homeFor(user.role));
    } catch (error) {
      toast.push(error.response?.data?.message || 'Unable to sign in', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="text-sm font-semibold">CampusHire</p>
        <div>
          <h1 className="max-w-md text-4xl font-semibold tracking-tight">
            A quieter, faster way to manage campus placements.
          </h1>
          <p className="mt-4 max-w-md text-slate-400">
            Sign in to continue to your workspace. Roles are enforced on the server, not the UI.
          </p>
        </div>
        <p className="text-sm text-slate-500">Students · Recruiters · Placement cell</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-md space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">
              New here?{' '}
              <Link className="text-brand-600" to="/register">
                Create an account
              </Link>
            </p>
          </div>
          <input
            className="input"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Continue'}
          </button>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Demo accounts</p>
            <div className="mt-3 space-y-2">
              {demos.map((demo) => (
                <button
                  type="button"
                  key={demo.email}
                  className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-left text-sm"
                  onClick={() => setForm({ email: demo.email, password: demo.password })}
                >
                  <span>{demo.role}</span>
                  <span className="text-slate-400">{demo.email}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
