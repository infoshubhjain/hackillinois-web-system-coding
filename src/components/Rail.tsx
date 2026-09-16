import { forwardRef } from "react";
import { EVENT_TYPES, type EventType } from "../api/events";
import { EVENT_TYPE_META } from "../lib/eventMeta";
import type { FreeBlock, HourBucket, ScheduleDay, ScheduleFilters } from "../lib/schedule";
import { EMPTY_FILTERS } from "../lib/schedule";
import { formatDuration, formatTimeRange } from "../lib/time";
import { DayShape } from "./DayShape";
import { Icon } from "./Icon";

interface RailProps {
  days: ScheduleDay[];
  activeDay: string;
  onSelectDay: (key: string) => void;
  filters: ScheduleFilters;
  onChangeFilters: (next: ScheduleFilters) => void;
  typeCounts: Record<EventType, number>;
  favoriteCount: number;
  proCount: number;
  /** Events shown on the active day, and across the whole weekend. */
  dayCount: number;
  totalCount: number;
  shape: HourBucket[];
  currentHour: number | null;
  onJumpToHour: (slotKey: string) => void;
  freeBlocks: FreeBlock[];
  minFreeMinutes: number;
  onChangeMinFree: (minutes: number) => void;
}

/**
 * Persistent control rail: search, day switcher, and filters with live counts.
 *
 * Counts are the point. A filter row without them is a guessing game — here
 * every number is exactly what you get when you click it, and a filter that
 * would return nothing is disabled rather than silently emptying the page.
 */
export const Rail = forwardRef<HTMLInputElement, RailProps>(function Rail(
  {
    days,
    activeDay,
    onSelectDay,
    filters,
    onChangeFilters,
    typeCounts,
    favoriteCount,
    proCount,
    dayCount,
    totalCount,
    shape,
    currentHour,
    onJumpToHour,
    freeBlocks,
    minFreeMinutes,
    onChangeMinFree,
  },
  searchRef
) {
  const toggleType = (type: EventType) =>
    onChangeFilters({
      ...filters,
      types: filters.types.includes(type)
        ? filters.types.filter((t) => t !== type)
        : [...filters.types, type],
    });

  const isFiltered =
    Boolean(filters.query) ||
    filters.types.length > 0 ||
    filters.onlyFavorites ||
    filters.onlyPro;

  return (
    <aside className="rail" aria-label="Schedule controls">
      <div className="rail__search">
        <Icon name="search" size={15} />
        <input
          ref={searchRef}
          type="search"
          value={filters.query}
          placeholder="Search"
          aria-label="Search events, rooms and sponsors"
          onChange={(e) => onChangeFilters({ ...filters, query: e.target.value })}
        />
        <kbd aria-hidden="true">/</kbd>
      </div>

      <section className="rail__group">
        <h2 className="rail__heading">Days</h2>
        <div className="rail__days" role="tablist" aria-label="Schedule days">
          {days.map((day) => (
            <button
              key={day.key}
              type="button"
              role="tab"
              aria-selected={day.key === activeDay}
              className={`dayrow ${day.key === activeDay ? "is-active" : ""}`}
              onClick={() => onSelectDay(day.key)}
            >
              <span className="dayrow__name">{day.name}</span>
              <span className="dayrow__date">{day.date}</span>
              <span className="dayrow__count">{day.count}</span>
            </button>
          ))}
        </div>
      </section>

      <DayShape buckets={shape} currentHour={currentHour} onJump={onJumpToHour} />

      <section className="rail__group">
        <h2 className="rail__heading">Type</h2>
        <div className="rail__list">
          {EVENT_TYPES.map((type) => {
            const meta = EVENT_TYPE_META[type];
            const count = typeCounts[type] ?? 0;
            const active = filters.types.includes(type);

            return (
              <button
                key={type}
                type="button"
                className={`filterrow filterrow--${type.toLowerCase()} ${
                  active ? "is-active" : ""
                }`}
                aria-pressed={active}
                disabled={!count && !active}
                onClick={() => toggleType(type)}
              >
                <Icon name={meta.icon} size={15} />
                <span className="filterrow__label">{meta.label}</span>
                <span className="filterrow__count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rail__group">
        <h2 className="rail__heading">Refine</h2>
        <div className="rail__list">
          <button
            type="button"
            className={`filterrow ${filters.onlyFavorites ? "is-active" : ""}`}
            aria-pressed={filters.onlyFavorites}
            disabled={!favoriteCount && !filters.onlyFavorites}
            onClick={() =>
              onChangeFilters({ ...filters, onlyFavorites: !filters.onlyFavorites })
            }
          >
            <Icon name="star" size={15} filled={filters.onlyFavorites} />
            <span className="filterrow__label">My schedule</span>
            <span className="filterrow__count">{favoriteCount}</span>
          </button>

          <button
            type="button"
            className={`filterrow ${filters.onlyPro ? "is-active" : ""}`}
            aria-pressed={filters.onlyPro}
            disabled={!proCount && !filters.onlyPro}
            onClick={() => onChangeFilters({ ...filters, onlyPro: !filters.onlyPro })}
          >
            <Icon name="terminal" size={15} />
            <span className="filterrow__label">Pro track</span>
            <span className="filterrow__count">{proCount}</span>
          </button>
        </div>
      </section>
      <section className="rail__group" aria-label="Open hacking time">
        <h2 className="rail__heading">Open time</h2>
        {favoriteCount === 0 ? (
          <p className="rail__note">
            Star events to map the open blocks where you can actually code.
          </p>
        ) : (
          <>
            <div className="freeopts" role="group" aria-label="Minimum open block">
              {[60, 120, 180].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={`freeopt ${minFreeMinutes === minutes ? "is-active" : ""}`}
                  aria-pressed={minFreeMinutes === minutes}
                  onClick={() => onChangeMinFree(minutes)}
                >
                  {minutes / 60}h+
                </button>
              ))}
            </div>
            {freeBlocks.length === 0 ? (
              <p className="rail__note">No open blocks that long on this day.</p>
            ) : (
              <ul className="freelist">
                {freeBlocks.map((block) => (
                  <li key={block.start} className="freeblock">
                    <span className="freeblock__range">
                      {formatTimeRange(block.start, block.end)}
                    </span>
                    <span className="freeblock__count">
                      {formatDuration(block.start, block.end)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {/* Two numbers, because "19 shown" alone is ambiguous when three days
          of events are loaded. */}
      <p className="rail__summary" aria-live="polite">
        <span className="rail__result">{dayCount}</span>
        <span className="rail__summary-text">
          on {days.find((day) => day.key === activeDay)?.name ?? "this day"}
          <br />
          {totalCount} across the weekend
        </span>
        {isFiltered && (
          <button
            type="button"
            className="linkbutton"
            onClick={() => onChangeFilters(EMPTY_FILTERS)}
          >
            Reset
          </button>
        )}
      </p>
    </aside>
  );
});
