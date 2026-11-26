export default function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-rose-900">{title}</h3>
      <p className="mt-2 text-sm text-rose-700">{description || 'Please try again in a moment.'}</p>
      {onRetry ? (
        <button className="btn-secondary mt-5" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
