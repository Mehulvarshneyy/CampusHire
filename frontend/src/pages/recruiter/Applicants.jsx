import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

const actions = [
  { status: 'UNDER_REVIEW', label: 'Under review' },
  { status: 'SHORTLISTED', label: 'Shortlist' },
  { status: 'INTERVIEW_SCHEDULED', label: 'Schedule interview' },
  { status: 'SELECTED', label: 'Select' },
  { status: 'REJECTED', label: 'Reject' }
];

export default function Applicants() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [interviewAt, setInterviewAt] = useState('');

  async function load() {
    const res = await client.get(`/jobs/${id}/applicants`, { params: { page, limit: 10 } });
    setData(res.data);
  }

  useEffect(() => {
    load();
  }, [id, page]);

  if (!data) return <Spinner />;

  async function changeStatus(status) {
    try {
      await client.patch(`/applications/${selected.id}/status`, {
        status,
        note,
        interviewAt: interviewAt ? new Date(interviewAt).toISOString() : null
      });
      toast.push('Application updated');
      setSelected(null);
      load();
    } catch (error) {
      toast.push(error.response?.data?.message || 'Update failed', 'error');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Applicants</h1>
        <p className="mt-1 text-sm text-slate-500">{data.job?.title}</p>
      </div>
      {!data.items?.length ? (
        <EmptyState title="No applicants yet" description="Applications for this role will appear here." />
      ) : (
      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Year</th>
              <th className="px-4 py-3 font-medium">CGPA</th>
              <th className="px-4 py-3 font-medium">Skills</th>
              <th className="px-4 py-3 font-medium">Applied</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((app) => (
              <tr key={app.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-medium">{app.student_name}</p>
                  <p className="text-xs text-slate-400">{app.student_email}</p>
                </td>
                <td className="px-4 py-3">{app.department}</td>
                <td className="px-4 py-3">{app.graduation_year}</td>
                <td className="px-4 py-3">{app.cgpa}</td>
                <td className="px-4 py-3">{(app.skills || []).slice(0, 3).join(', ')}</td>
                <td className="px-4 py-3">{formatDate(app.created_at)}</td>
                <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                <td className="px-4 py-3">
                  <button className="text-brand-600" onClick={() => setSelected(app)}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      <Pagination pagination={data.pagination} onPage={setPage} />
      <Modal open={Boolean(selected)} title="Applicant profile" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm">
            <p className="font-medium">{selected.student_name}</p>
            <p className="text-slate-500">{selected.student_email}</p>
            <p>CGPA {selected.cgpa} · {selected.department} · {selected.graduation_year}</p>
            <p>{(selected.skills || []).join(', ')}</p>
            {selected.resume_url ? (
              <a className="text-brand-600" href={selected.resume_url} target="_blank" rel="noreferrer">Open resume</a>
            ) : null}
            <textarea className="input" placeholder="Internal note" value={note} onChange={(e) => setNote(e.target.value)} />
            <input className="input" type="datetime-local" value={interviewAt} onChange={(e) => setInterviewAt(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <button key={action.status} className="btn-secondary" onClick={() => changeStatus(action.status)}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
