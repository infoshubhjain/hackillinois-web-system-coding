import { useEffect, useRef } from "react";
import type { HackEvent } from "../api/events";
import { EVENT_TYPE_META } from "../lib/eventMeta";
import {
  formatDayName,
  formatDuration,
  formatTimeRange,
  toDate,
} from "../lib/time";
import { Icon } from "./Icon";

interface EventDetailProps {
  event: HackEvent;
  isFavorite: boolean;
  onToggleFavorite: (eventId: string) => void;
  onClose: () => void;
}

/** `YYYYMMDDTHHMMSSZ` — the format Google Calendar expects. */
const toCalendarStamp = (unixSeconds: number) =>
  toDate(unixSeconds).toISOString().replace(/[-:]|\.\d{3}/g, "");

function googleCalendarUrl(event: HackEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    details: event.description,
    location: event.locations[0]?.description ?? "HackIllinois",
    dates: `${toCalendarStamp(event.startTime)}/${toCalendarStamp(event.endTime)}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function EventDetail({
  event,
  isFavorite,
  onToggleFavorite,
  onClose,
}: EventDetailProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const meta = EVENT_TYPE_META[event.eventType];

  // Escape closes, focus starts inside the dialog, background stops scrolling.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal" onClick={onClose}>
      <div
        className={`modal__panel modal__panel--${event.eventType.toLowerCase()}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
          ref={closeButtonRef}
          aria-label="Close event details"
        >
          <Icon name="close" size={16} />
        </button>

        <div className="modal__tags">
          <span className="tag">
            <Icon name={meta.icon} size={13} />
            {meta.label}
          </span>
          {event.isPro && <span className="tag tag--pro">Pro</span>}
          {event.isMandatory && <span className="tag tag--required">Required</span>}
        </div>

        <h2 id="event-detail-title" className="modal__title">
          {event.name}
        </h2>

        <p className="modal__when">
          <Icon name="clock" size={14} />
          {formatDayName(event.startTime)},{" "}
          {formatTimeRange(event.startTime, event.endTime)} ·{" "}
          {formatDuration(event.startTime, event.endTime)} · Central
        </p>

        {event.sponsor && (
          <p className="modal__sponsor">presented by {event.sponsor}</p>
        )}

        {event.description && (
          <p className="modal__description">{event.description}</p>
        )}

        {event.locations.length > 0 && (
          <section className="modal__section">
            <h3>Where</h3>
            <ul className="modal__list">
              {event.locations.map((location) => (
                <li key={`${location.latitude},${location.longitude}`}>
                  <Icon name="pin" size={14} />
                  <a
                    href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {location.description.trim() || "View on map"}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {event.menu && event.menu.length > 0 && (
          <section className="modal__section">
            <h3>On the menu</h3>
            <ul className="modal__list">
              {event.menu.map((item) => (
                <li key={item}>
                  <Icon name="bowl" size={14} />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {event.mapImageUrl && (
          <section className="modal__section">
            <h3>Floor map</h3>
            <img
              className="modal__map"
              src={event.mapImageUrl}
              alt={`Floor map for ${event.name}`}
              loading="lazy"
            />
          </section>
        )}

        <footer className="modal__actions">
          <button
            type="button"
            className={`button ${isFavorite ? "button--ghost" : ""}`}
            onClick={() => onToggleFavorite(event.eventId)}
          >
            <Icon name="star" size={15} filled={isFavorite} />
            {isFavorite ? "In my schedule" : "Add to my schedule"}
          </button>
          <a
            className="button button--ghost"
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="calendar" size={15} />
            Google Calendar
          </a>
        </footer>
      </div>
    </div>
  );
}
