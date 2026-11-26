import { prettyStatus, statusStyles } from '../../lib/format';

export default function StatusBadge({ status }) {
  return <span className={`badge ${statusStyles(status)}`}>{prettyStatus(status)}</span>;
}
