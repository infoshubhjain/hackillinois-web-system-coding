import { useEffect, useRef } from "react";
import type { HackEvent } from "../api/events";
import { EVENT_TYPE_META } from "../lib/eventMeta";
import {
  formatDayName,
  formatDuration,
  formatTimeRange,
  toDate,
} from "../lib/time";

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

  const meta = EVENT_TYPE_META[event.eventType];

  return (
    <div className="modal" onClick={onClose}>
      <div
        className="modal__panel"
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
          ✕
        </button>

        <span className="chip chip--type">
          <span aria-hidden="true">{meta.emoji}</span> {meta.label}
        </span>

        <h2 id="event-detail-title" className="modal__title">
          {event.name}
        </h2>

        <p className="modal__when">
          {formatDayName(event.startTime)},{" "}
          {formatTimeRange(event.startTime, event.endTime)} ·{" "}
          {formatDuration(event.startTime, event.endTime)} · CST
        </p>

        {event.description && (
          <p className="modal__description">{event.description}</p>
        )}

        {event.locations.length > 0 && (
          <section className="modal__section">
            <h3>Where</h3>
            <ul className="modal__list">
              {event.locations.map((location) => (
                <li key={`${location.latitude},${location.longitude}`}>
                  📍{" "}
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
                <li key={item}>🍽️ {item}</li>
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
            {isFavorite ? "★ In my schedule" : "☆ Add to my schedule"}
          </button>
          <a
            className="button button--ghost"
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noreferrer"
          >
            Add to Google Calendar
          </a>
        </footer>
      </div>
    </div>
  );
}
