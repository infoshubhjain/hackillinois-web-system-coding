import type { HackEvent } from "../api/events";
import { formatCountdown, formatTime } from "../lib/time";

interface HeaderProps {
  now: number;
  liveEvents: HackEvent[];
  nextEvent?: HackEvent;
  updatedAt: number | null;
  onRefresh: () => void;
  onSelectEvent: (event: HackEvent) => void;
}

/**
 * Hero banner. The "right now / up next" strip answers the question a hacker
 * actually has when they open the schedule, without scrolling.
 */
export function Header({
  now,
  liveEvents,
  nextEvent,
  updatedAt,
  onRefresh,
  onSelectEvent,
}: HeaderProps) {
  return (
    <header className="hero">
      <div className="hero__inner">
        <p className="hero__eyebrow">HackIllinois 2026</p>
        <h1 className="hero__title">
          Dive into the <span>Schedule</span>
        </h1>
        <p className="hero__subtitle">
          Every talk, workshop, meal and mini-event — charted from the depths of
          the HackIllinois API. All times shown in Central Time.
        </p>

        <div className="hero__status">
          {liveEvents.length > 0 ? (
            <button
              type="button"
              className="nowcard nowcard--live"
              onClick={() => onSelectEvent(liveEvents[0])}
            >
              <span className="nowcard__label">
                <span className="pulse" aria-hidden="true" /> Happening now
              </span>
              <span className="nowcard__name">{liveEvents[0].name}</span>
              <span className="nowcard__time">
                until {formatTime(liveEvents[0].endTime)}
                {liveEvents.length > 1 && ` · +${liveEvents.length - 1} more`}
              </span>
            </button>
          ) : null}

          {nextEvent ? (
            <button
              type="button"
              className="nowcard"
              onClick={() => onSelectEvent(nextEvent)}
            >
              <span className="nowcard__label">Up next</span>
              <span className="nowcard__name">{nextEvent.name}</span>
              <span className="nowcard__time">
                {formatTime(nextEvent.startTime)} ·{" "}
                {formatCountdown(nextEvent.startTime, now)}
              </span>
            </button>
          ) : null}

          {/* Nothing live and nothing left: the event is over (or not announced). */}
          {liveEvents.length === 0 && !nextEvent && (
            <p className="hero__resting">
              🐚 No sessions in progress — you&apos;re browsing the full archive.
            </p>
          )}
        </div>

        <div className="hero__refresh">
          <button type="button" className="linkbutton" onClick={onRefresh}>
            ⟳ Refresh
          </button>
          {updatedAt && (
            <span className="hero__updated">
              updated {new Date(updatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Decorative wave that separates the hero from the schedule below. */}
      <svg className="hero__wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,64 C240,120 480,0 720,40 C960,80 1200,120 1440,64 L1440,120 L0,120 Z" />
      </svg>
    </header>
  );
}
