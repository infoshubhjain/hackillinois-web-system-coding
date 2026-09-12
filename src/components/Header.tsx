import type { HackEvent } from "../api/events";
import { formatCountdown, formatTime } from "../lib/time";

interface HeaderProps {
  now: number;
  liveEvents: HackEvent[];
  nextEvent?: HackEvent;
  totalEvents: number;
  dayCount: number;
  updatedAt: number | null;
  source: "live" | "snapshot";
  onRefresh: () => void;
  onSelectEvent: (event: HackEvent) => void;
}

/** Headline words animate in one at a time, each from behind its own mask. */
const TITLE = ["Dive", "into", "the"];

/**
 * Cinematic hero. Full-viewport framing, kinetic headline, a live "right now /
 * up next" strip, and a scroll cue — the whole thing parallaxes and fades as
 * the reader descends (driven by the `--scroll` variable from `useAmbient`).
 */
export function Header({
  now,
  liveEvents,
  nextEvent,
  totalEvents,
  dayCount,
  updatedAt,
  source,
  onRefresh,
  onSelectEvent,
}: HeaderProps) {
  return (
    <header className="hero">
      <div className="hero__inner">
        <p className="label hero__eyebrow">
          <span className="hero__rule" aria-hidden="true" />
          HackIllinois 2026 · Schedule
        </p>

        <h1 className="hero__title">
          {TITLE.map((word, index) => (
            <span className="hero__word" key={word}>
              <span style={{ animationDelay: `${0.15 + index * 0.09}s` }}>
                {word}
              </span>
            </span>
          ))}
          <span className="hero__word hero__word--accent">
            <span style={{ animationDelay: `${0.15 + TITLE.length * 0.09}s` }}>
              Schedule
            </span>
          </span>
        </h1>

        <p className="hero__subtitle">
          {totalEvents} events across {dayCount} days — talks, workshops, meals and
          mini-events, charted live from the HackIllinois API. All times Central.
        </p>

        <div className="hero__status">
          {liveEvents.length > 0 && (
            <button
              type="button"
              className="nowcard nowcard--live"
              onClick={() => onSelectEvent(liveEvents[0])}
            >
              <span className="label nowcard__label">
                <span className="pulse" aria-hidden="true" /> Happening now
              </span>
              <span className="nowcard__name">{liveEvents[0].name}</span>
              <span className="nowcard__time">
                until {formatTime(liveEvents[0].endTime)}
                {liveEvents.length > 1 && ` · +${liveEvents.length - 1} more`}
              </span>
            </button>
          )}

          {nextEvent && (
            <button
              type="button"
              className="nowcard"
              onClick={() => onSelectEvent(nextEvent)}
            >
              <span className="label nowcard__label">Up next</span>
              <span className="nowcard__name">{nextEvent.name}</span>
              <span className="nowcard__time">
                {formatTime(nextEvent.startTime)} ·{" "}
                {formatCountdown(nextEvent.startTime, now)}
              </span>
            </button>
          )}

          {/* Nothing live and nothing left: the event is over (or unannounced). */}
          {liveEvents.length === 0 && !nextEvent && (
            <p className="hero__resting">
              No sessions in progress — you&apos;re browsing the full archive.
            </p>
          )}
        </div>

        <div className="hero__meta">
          <button type="button" className="linkbutton" onClick={onRefresh}>
            <span aria-hidden="true">⟳</span> Refresh
          </button>
          {updatedAt && (
            <span className="hero__updated">
              updated {new Date(updatedAt).toLocaleTimeString()}
              {source === "snapshot" && (
                <>
                  {" · "}
                  <span title="The event API only allows browser requests from localhost and hackillinois.org, so this deployment reads a snapshot refreshed daily by CI.">
                    cached snapshot ⓘ
                  </span>
                </>
              )}
            </span>
          )}
        </div>

        <a className="hero__cue" href="#schedule">
          <span className="label">Descend</span>
          <span className="hero__cue-line" aria-hidden="true" />
        </a>
      </div>

      {/* Surface line separating the hero from the schedule below. */}
      <svg
        className="hero__wave"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="hero__wave-back"
          d="M0,70 C260,130 460,10 720,46 C980,82 1180,132 1440,68 L1440,140 L0,140 Z"
        />
        <path
          className="hero__wave-front"
          d="M0,96 C300,140 520,50 780,80 C1020,108 1220,140 1440,96 L1440,140 L0,140 Z"
        />
      </svg>
    </header>
  );
}
