import type { HackEvent } from "../api/events";
import { EVENT_TYPE_META } from "../lib/eventMeta";
import { formatDuration, formatTimeRange, getProgress, getStatus } from "../lib/time";

interface EventCardProps {
  event: HackEvent;
  now: number;
  isFavorite: boolean;
  onToggleFavorite: (eventId: string) => void;
  onSelect: (event: HackEvent) => void;
}

export function EventCard({
  event,
  now,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: EventCardProps) {
  const status = getStatus(event, now);
  const meta = EVENT_TYPE_META[event.eventType];
  const room = event.locations[0]?.description.trim();

  return (
    <article
      className={`card card--${event.eventType.toLowerCase()} card--${status}`}
    >
      {/* The whole card opens the detail dialog; the star button sits above it. */}
      <button
        type="button"
        className="card__surface"
        onClick={() => onSelect(event)}
        aria-label={`View details for ${event.name}`}
      >
        <header className="card__head">
          <span className="chip chip--type">
            <span aria-hidden="true">{meta.emoji}</span> {meta.label}
          </span>
          {status === "live" && <span className="chip chip--live">Live now</span>}
          {event.isPro && <span className="chip chip--pro">Pro</span>}
          {event.isMandatory && <span className="chip chip--required">Required</span>}
        </header>

        <h3 className="card__title">{event.name}</h3>

        <p className="card__meta">
          <span>🕒 {formatTimeRange(event.startTime, event.endTime)}</span>
          <span className="card__dot" aria-hidden="true">
            •
          </span>
          <span>{formatDuration(event.startTime, event.endTime)}</span>
        </p>

        {room && <p className="card__meta card__meta--muted">📍 {room}</p>}
        {event.sponsor && (
          <p className="card__meta card__meta--muted">🤝 {event.sponsor}</p>
        )}

        {event.description && (
          <p className="card__description">{event.description}</p>
        )}

        {status === "live" && (
          <div
            className="card__progress"
            role="progressbar"
            aria-label="Event progress"
            aria-valuenow={Math.round(getProgress(event, now) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${getProgress(event, now) * 100}%` }} />
          </div>
        )}
      </button>

      <button
        type="button"
        className={`card__star ${isFavorite ? "is-active" : ""}`}
        onClick={() => onToggleFavorite(event.eventId)}
        aria-pressed={isFavorite}
        aria-label={
          isFavorite ? `Unstar ${event.name}` : `Star ${event.name}`
        }
        title={isFavorite ? "Remove from my schedule" : "Add to my schedule"}
      >
        {isFavorite ? "★" : "☆"}
      </button>
    </article>
  );
}
