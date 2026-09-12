import { forwardRef } from "react";
import { EVENT_TYPES, type EventType } from "../api/events";
import { EVENT_TYPE_META } from "../lib/eventMeta";
import type { ScheduleDay, ScheduleFilters } from "../lib/schedule";
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
            onClick={() =>
              onChangeFilters({
                query: "",
                types: [],
                onlyFavorites: false,
                onlyPro: false,
              })
            }
          >
            Reset
          </button>
        )}
      </p>
    </aside>
  );
});
