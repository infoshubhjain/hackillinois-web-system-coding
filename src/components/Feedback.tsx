import { Icon } from "./Icon";

/** Placeholder rows shown while the first fetch is in flight. */
export function ScheduleSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="skeletons" aria-busy="true" aria-label="Loading schedule">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" style={{ animationDelay: `${i * 90}ms` }} />
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
      <Icon name="sonar" size={40} className="empty__icon" />
      <h2>Lost the signal</h2>
      <p>Couldn&apos;t reach the HackIllinois event service — {message}</p>
      <button type="button" className="button" onClick={onRetry}>
        <Icon name="refresh" size={15} /> Try again
      </button>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty">
      <Icon name="sonar" size={40} className="empty__icon" />
      <h2>Nothing down here</h2>
      <p>{message}</p>
    </div>
  );
}
