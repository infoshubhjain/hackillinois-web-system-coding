/** Placeholder cards shown while the first fetch is in flight. */
export function ScheduleSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="skeletons" aria-busy="true" aria-label="Loading schedule">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="empty" role="alert">
      <p className="empty__emoji" aria-hidden="true">
        🪼
      </p>
      <h2>We lost the signal</h2>
      <p>Couldn&apos;t reach the HackIllinois event service: {message}</p>
      <button type="button" className="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty">
      <p className="empty__emoji" aria-hidden="true">
        🐡
      </p>
      <h2>Nothing in these waters</h2>
      <p>{message}</p>
    </div>
  );
}
