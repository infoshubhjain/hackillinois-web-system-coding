import { useRef } from "react";
import type { HackEvent } from "../api/events";
import { EVENT_TYPE_META } from "../lib/eventMeta";
import { formatDuration, formatTimeRange, getProgress, getStatus } from "../lib/time";

interface EventCardProps {
  event: HackEvent;
  now: number;
  /** Position in the list, used to stagger the reveal animation. */
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (eventId: string) => void;
  onSelect: (event: HackEvent) => void;
}

/** Max degrees of tilt at the corners of the card. */
const TILT = 3.5;

export function EventCard({
  event,
  now,
  index,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: EventCardProps) {
  const ref = useRef<HTMLElement>(null);
  const status = getStatus(event, now);
  const meta = EVENT_TYPE_META[event.eventType];
  const room = event.locations[0]?.description.trim();

  /**
   * Writes the cursor's position on the card as CSS variables. The stylesheet
   * uses them for the glare highlight and a subtle 3D tilt — doing it with
   * custom properties keeps this off the React render path entirely.
   */
  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const card = ref.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    card.style.setProperty("--mx", `${x * 100}%`);
    card.style.setProperty("--my", `${y * 100}%`);
    card.style.setProperty("--tilt-x", `${(0.5 - y) * TILT}deg`);
    card.style.setProperty("--tilt-y", `${(x - 0.5) * TILT}deg`);
  };

  const handlePointerLeave = () => {
    const card = ref.current;
    if (!card) return;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <article
      ref={ref}
      className={`card card--${event.eventType.toLowerCase()} card--${status}`}
      data-reveal
      style={{ "--reveal-delay": `${Math.min(index, 6) * 60}ms` } as React.CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <span className="card__glare" aria-hidden="true" />

      {/* The whole card opens the detail dialog; the star sits above it. */}
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
          {status === "live" && (
            <span className="chip chip--live">
              <span className="pulse" aria-hidden="true" /> Live
            </span>
          )}
          {event.isPro && <span className="chip chip--pro">Pro</span>}
          {event.isMandatory && <span className="chip chip--required">Required</span>}
        </header>

        <h3 className="card__title">{event.name}</h3>

        <p className="card__meta">
          <span className="card__time">
            {formatTimeRange(event.startTime, event.endTime)}
          </span>
          <span className="card__dot" aria-hidden="true" />
          <span>{formatDuration(event.startTime, event.endTime)}</span>
          {room && (
            <>
              <span className="card__dot" aria-hidden="true" />
              <span className="card__room">{room}</span>
            </>
          )}
        </p>

        {event.sponsor && (
          <p className="card__sponsor">presented by {event.sponsor}</p>
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
        aria-label={isFavorite ? `Unstar ${event.name}` : `Star ${event.name}`}
        title={isFavorite ? "Remove from my schedule" : "Add to my schedule"}
      >
        {isFavorite ? "★" : "☆"}
      </button>
    </article>
  );
}
