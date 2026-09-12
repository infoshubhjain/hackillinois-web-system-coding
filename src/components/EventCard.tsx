import { useRef } from "react";
import type { HackEvent } from "../api/events";
import { EVENT_TYPE_META } from "../lib/eventMeta";
import { formatDuration, formatTimeRange, getProgress, getStatus } from "../lib/time";
import { Icon } from "./Icon";

interface EventCardProps {
  event: HackEvent;
  now: number;
  /** Position in the list, used to stagger the reveal animation. */
  index: number;
  isFavorite: boolean;
  /** True for the moment right after this event was starred. */
  justStarred: boolean;
  /** True while this card is morphing into the detail dialog. */
  isMorphing: boolean;
  onToggleFavorite: (eventId: string) => void;
  onSelect: (event: HackEvent) => void;
}

/** Max degrees of tilt at the corners of the card. */
const TILT = 3;

/** A three-hour event fills the duration bar; longer ones cap it. */
const FULL_BAR_MINUTES = 180;

export function EventCard({
  event,
  now,
  index,
  isFavorite,
  justStarred,
  isMorphing,
  onToggleFavorite,
  onSelect,
}: EventCardProps) {
  const ref = useRef<HTMLElement>(null);
  const status = getStatus(event, now);
  const meta = EVENT_TYPE_META[event.eventType];
  const room = event.locations[0]?.description.trim();
  const minutes = Math.max(1, Math.round((event.endTime - event.startTime) / 60));

  /**
   * Writes the cursor's position on the card as CSS variables, for the glare
   * highlight and a small 3D tilt. Custom properties keep this entirely off
   * the React render path.
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
      style={
        {
          "--reveal-delay": `${Math.min(index, 6) * 55}ms`,
          // Hands this card's pixels to the dialog during a view transition.
          viewTransitionName: isMorphing ? "event-morph" : undefined,
        } as React.CSSProperties
      }
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
          <span className="tag">
            <Icon name={meta.icon} size={13} />
            {meta.label}
          </span>
          {status === "live" && (
            <span className="tag tag--live">
              <span className="pulse" aria-hidden="true" /> Live
            </span>
          )}
          {event.isPro && <span className="tag tag--pro">Pro</span>}
          {event.isMandatory && <span className="tag tag--required">Required</span>}
        </header>

        <h3 className="card__title">{event.name}</h3>

        <p className="card__meta">
          <span className="card__time">
            {formatTimeRange(event.startTime, event.endTime)}
          </span>
          {/* A deadline is a point in time, not a span — don't print "0m". */}
          {minutes > 1 && (
            <span className="card__duration">
              {formatDuration(event.startTime, event.endTime)}
            </span>
          )}
          {room && (
            <span className="card__room">
              <Icon name="pin" size={13} />
              {room}
            </span>
          )}
        </p>

        {/* One bar does both jobs: its width is how long the event runs, and
            its fill is how much of it has already gone. */}
        {minutes > 1 && (
          <span
            className="card__bar"
            role={status === "live" ? "progressbar" : undefined}
            aria-label={status === "live" ? "Event progress" : undefined}
            aria-valuenow={
              status === "live" ? Math.round(getProgress(event, now) * 100) : undefined
            }
            aria-valuemin={status === "live" ? 0 : undefined}
            aria-valuemax={status === "live" ? 100 : undefined}
            aria-hidden={status === "live" ? undefined : true}
            style={
              {
                "--span": Math.min(1, minutes / FULL_BAR_MINUTES),
                "--progress": status === "live" ? getProgress(event, now) : 0,
              } as React.CSSProperties
            }
          />
        )}

        {event.sponsor && (
          <p className="card__sponsor">presented by {event.sponsor}</p>
        )}

        {event.description && (
          <p className="card__description">{event.description}</p>
        )}

      </button>

      <button
        type="button"
        className={`card__star ${isFavorite ? "is-active" : ""} ${
          justStarred ? "is-burst" : ""
        }`}
        onClick={() => onToggleFavorite(event.eventId)}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `Unstar ${event.name}` : `Star ${event.name}`}
        title={isFavorite ? "Remove from my schedule" : "Add to my schedule"}
      >
        <Icon name="star" size={16} filled={isFavorite} />
      </button>
    </article>
  );
}
