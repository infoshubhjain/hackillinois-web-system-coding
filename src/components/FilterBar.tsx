import { EVENT_TYPES, type EventType } from "../api/events";
import { EVENT_TYPE_META } from "../lib/eventMeta";
import type { ScheduleFilters } from "../lib/schedule";

interface FilterBarProps {
  filters: ScheduleFilters;
  onChange: (next: ScheduleFilters) => void;
  favoriteCount: number;
  resultCount: number;
}

export function FilterBar({
  filters,
  onChange,
  favoriteCount,
  resultCount,
}: FilterBarProps) {
  const toggleType = (type: EventType) => {
    const types = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onChange({ ...filters, types });
  };

  const hasActiveFilter =
    filters.query || filters.types.length || filters.onlyFavorites || filters.onlyPro;

  return (
    <section className="filters" aria-label="Filter events">
      <div className="filters__search">
        <span aria-hidden="true">🔍</span>
        <input
          type="search"
          value={filters.query}
          placeholder="Search events, rooms, sponsors…"
          aria-label="Search events"
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
        />
      </div>

      <div className="filters__chips">
        {EVENT_TYPES.map((type) => {
          const active = filters.types.includes(type);
          return (
            <button
              key={type}
              type="button"
              className={`chip chip--filter ${active ? "is-active" : ""}`}
              aria-pressed={active}
              onClick={() => toggleType(type)}
            >
              <span aria-hidden="true">{EVENT_TYPE_META[type].emoji}</span>{" "}
              {EVENT_TYPE_META[type].label}
            </button>
          );
        })}

        <button
          type="button"
          className={`chip chip--filter ${filters.onlyFavorites ? "is-active" : ""}`}
          aria-pressed={filters.onlyFavorites}
          onClick={() =>
            onChange({ ...filters, onlyFavorites: !filters.onlyFavorites })
          }
        >
          ★ My schedule ({favoriteCount})
        </button>

        <button
          type="button"
          className={`chip chip--filter ${filters.onlyPro ? "is-active" : ""}`}
          aria-pressed={filters.onlyPro}
          onClick={() => onChange({ ...filters, onlyPro: !filters.onlyPro })}
        >
          🦈 Pro track
        </button>
      </div>

      <p className="filters__summary" aria-live="polite">
        {resultCount} event{resultCount === 1 ? "" : "s"} match
        {hasActiveFilter ? (
          <button
            type="button"
            className="linkbutton"
            onClick={() =>
              onChange({ query: "", types: [], onlyFavorites: false, onlyPro: false })
            }
          >
            Clear filters
          </button>
        ) : null}
      </p>
    </section>
  );
}
