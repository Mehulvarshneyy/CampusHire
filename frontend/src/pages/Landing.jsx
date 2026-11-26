import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Briefcase, CheckCircle2, ShieldCheck, Users } from 'lucide-react';

const roles = [
  {
    title: 'Students',
    text: 'Browse eligible roles, apply in one click, and follow every status change from review to offer.'
  },
  {
    title: 'Recruiters',
    text: 'Publish jobs, shortlist applicants, schedule interviews, and mark selected candidates.'
  },
  {
    title: 'Placement cell',
    text: 'Approve recruiters, monitor listings, and see placement analytics across departments.'
  }
];

const steps = [
  { n: '01', title: 'Publish roles', text: 'Approved recruiters post jobs with eligibility, CTC, and deadlines.' },
  { n: '02', title: 'Apply with fit', text: 'Students see only open roles and are blocked when they miss eligibility.' },
  { n: '03', title: 'Review pipeline', text: 'Recruiters move applications through review, interview, and selection.' },
  { n: '04', title: 'Measure outcomes', text: 'Admins track hiring by company, department, and placement rate.' }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight text-slate-950">CampusHire</span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary">
              Sign in
            </Link>
            <Link to="/register" className="btn-primary">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-14">
        <p className="text-sm font-medium text-brand-600">University placement platform</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          Run campus hiring with the same clarity as a modern SaaS product.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-500">
          CampusHire connects students, recruiters, and placement administrators — from publishing
          eligible roles to interviews, offers, and placement analytics.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="btn-primary">
            Create an account <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn-secondary">
            Use a demo login
          </Link>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {roles.map((role) => (
            <div key={role.title} className="card p-5">
              <h2 className="text-base font-semibold">{role.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{role.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Built around the real placement workflow</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Every status change is persisted in PostgreSQL with history, notifications, and role checks
              on the server.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((step) => (
              <div key={step.n} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-medium text-brand-600">{step.n}</p>
                <p className="mt-2 font-medium">{step.title}</p>
                <p className="mt-1 text-sm text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <Briefcase className="text-brand-600" size={20} />
            <h3 className="mt-4 font-semibold">Job pipeline</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Search, eligibility filters, pagination, and closed/expired jobs that no longer accept applications.
            </p>
          </div>
          <div className="card p-5">
            <Users className="text-brand-600" size={20} />
            <h3 className="mt-4 font-semibold">Applicant review</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Shortlist, reject, schedule interviews, and select candidates with a full audit trail.
            </p>
          </div>
          <div className="card p-5">
            <BarChart3 className="text-brand-600" size={20} />
            <h3 className="mt-4 font-semibold">Admin analytics</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Placement rate, department outcomes, company hiring, and application volume over time.
            </p>
          </div>
        </div>
        <div className="mt-4 card flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 text-brand-600" size={20} />
            <div>
              <p className="font-semibold">Authorization is never trusted from the client</p>
              <p className="mt-1 text-sm text-slate-500">
                JWT sessions, bcrypt passwords, recruiter approvals, and per-record ownership checks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Students, recruiters, and admins each get a dedicated workspace
          </div>
        </div>
      </section>
    </div>
  );
}
