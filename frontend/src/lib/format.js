export function formatINR(value) {
  if (value === null || value === undefined || value === '') return 'Not specified';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value));
}

export function formatSalary(min, max) {
  if (!min && !max) return 'Not disclosed';
  if (min && max) return `${formatINR(min)} – ${formatINR(max)}`;
  return formatINR(min || max);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function employmentLabel(type) {
  return {
    FULL_TIME: 'Full-time',
    INTERNSHIP: 'Internship',
    CONTRACT: 'Contract',
    PART_TIME: 'Part-time'
  }[type] || type;
}

export function statusStyles(status) {
  const map = {
    APPLIED: 'bg-slate-100 text-slate-700',
    UNDER_REVIEW: 'bg-sky-50 text-sky-700',
    SHORTLISTED: 'bg-indigo-50 text-indigo-700',
    INTERVIEW_SCHEDULED: 'bg-amber-50 text-amber-700',
    SELECTED: 'bg-emerald-50 text-emerald-700',
    REJECTED: 'bg-rose-50 text-rose-700',
    WITHDRAWN: 'bg-slate-100 text-slate-500',
    OPEN: 'bg-emerald-50 text-emerald-700',
    CLOSED: 'bg-slate-100 text-slate-600',
    EXPIRED: 'bg-slate-100 text-slate-500',
    PENDING: 'bg-amber-50 text-amber-700',
    APPROVED: 'bg-emerald-50 text-emerald-700'
  };
  return map[status] || 'bg-slate-100 text-slate-700';
}

export function prettyStatus(status) {
  return String(status || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
