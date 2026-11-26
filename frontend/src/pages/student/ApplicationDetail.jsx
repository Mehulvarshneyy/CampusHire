import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

export default function ApplicationDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);

  async function load() {
    const res = await client.get(`/applications/${id}`);
    setData(res.data);
  }

  useEffect(() => {
    load();
  }, [id]);

  if (!data) return <Spinner />;
  const { application, history } = data;

  async function withdraw() {
    try {
      await client.patch(`/applications/${id}/withdraw`);
      toast.push('Application withdrawn');
      load();
    } catch (error) {
      toast.push(error.response?.data?.message || 'Unable to withdraw', 'error');
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{application.company_name}</p>
            <h1 className="text-2xl font-semibold">{application.title}</h1>
          </div>
          <StatusBadge status={application.status} />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Applied {formatDate(application.created_at)} · Last updated {formatDate(application.updated_at)}
        </p>
        {application.interview_at ? (
          <p className="mt-2 text-sm text-amber-700">Interview: {formatDate(application.interview_at)}</p>
        ) : null}
        {['SELECTED', 'REJECTED', 'WITHDRAWN'].includes(application.status) ? null : (
          <button className="btn-secondary mt-4" onClick={withdraw}>Withdraw application</button>
        )}
      </div>
      <section className="card p-6">
        <h2 className="font-semibold">Status history</h2>
        <div className="mt-4 space-y-3">
          {history.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <span>
                {item.from_status ? `${item.from_status} → ${item.to_status}` : item.to_status}
              </span>
              <span className="text-slate-400">{formatDate(item.created_at)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
