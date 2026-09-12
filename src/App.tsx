import { useEffect, useMemo, useState } from "react";
import type { HackEvent } from "./api/events";
import { DayTabs } from "./components/DayTabs";
import { EmptyState, ErrorState, ScheduleSkeleton } from "./components/Feedback";
import { EventCard } from "./components/EventCard";
import { EventDetail } from "./components/EventDetail";
import { FilterBar } from "./components/FilterBar";
import { Header } from "./components/Header";
import { OceanBackground } from "./components/OceanBackground";
import { useAmbient } from "./hooks/useAmbient";
import { useEvents } from "./hooks/useEvents";
import { useFavorites } from "./hooks/useFavorites";
import { useNow } from "./hooks/useNow";
import { useReveal } from "./hooks/useReveal";
import {
  EMPTY_FILTERS,
  filterEvents,
  findLiveEvents,
  findNextEvent,
  getDays,
  groupByTimeSlot,
  type ScheduleFilters,
} from "./lib/schedule";
import { dayKey } from "./lib/time";

export default function App() {
  const { events, status, error, updatedAt, source, refresh } = useEvents();
  const { favorites, toggleFavorite } = useFavorites();
  const now = useNow();
  useAmbient();

  const [filters, setFilters] = useState<ScheduleFilters>(EMPTY_FILTERS);
  const [activeDay, setActiveDay] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<HackEvent | null>(null);

  const days = useMemo(() => getDays(events), [events]);

  // Land on today if the event is running, otherwise on day one.
  useEffect(() => {
    if (!days.length || activeDay) return;
    const today = dayKey(now);
    setActiveDay(days.some((d) => d.key === today) ? today : days[0].key);
  }, [days, activeDay, now]);

  const visibleEvents = useMemo(
    () => filterEvents(events, filters, favorites),
    [events, filters, favorites]
  );

  const dayEvents = useMemo(
    () => visibleEvents.filter((event) => dayKey(event.startTime) === activeDay),
    [visibleEvents, activeDay]
  );

  const slots = useMemo(() => groupByTimeSlot(dayEvents), [dayEvents]);

  // Re-arm the scroll-reveal animation whenever the visible list changes.
  useReveal([slots, status]);

  // The banner always reflects the real schedule, never the current filters.
  const liveEvents = useMemo(() => findLiveEvents(events, now), [events, now]);
  const nextEvent = useMemo(() => findNextEvent(events, now), [events, now]);

  return (
    <div className="app">
      <OceanBackground />

      <Header
        now={now}
        liveEvents={liveEvents}
        nextEvent={nextEvent}
        totalEvents={events.length}
        dayCount={days.length}
        updatedAt={updatedAt}
        source={source}
        onRefresh={refresh}
        onSelectEvent={setSelectedEvent}
      />

      <main className="content" id="schedule">
        {status === "loading" && <ScheduleSkeleton />}

        {status === "error" && <ErrorState message={error ?? "Unknown error"} onRetry={refresh} />}

        {status === "ready" && (
          <>
            <div className="controls">
              <DayTabs days={days} activeKey={activeDay} onSelect={setActiveDay} />
              <FilterBar
                filters={filters}
                onChange={setFilters}
                favoriteCount={favorites.size}
                resultCount={visibleEvents.length}
              />
            </div>

            {slots.length === 0 ? (
              <EmptyState message="No events match your filters on this day. Try clearing a filter or checking another day." />
            ) : (
              <ol className="timeline">
                {slots.map((slot) => (
                  <li key={slot.key} className="timeline__slot">
                    <div className="timeline__time" data-reveal>
                      <span className="timeline__node" aria-hidden="true" />
                      <span className="timeline__label">{slot.label}</span>
                    </div>
                    <div className="timeline__events">
                      {slot.events.map((event, eventIndex) => (
                        <EventCard
                          key={event.eventId}
                          event={event}
                          index={eventIndex}
                          now={now}
                          isFavorite={favorites.has(event.eventId)}
                          onToggleFavorite={toggleFavorite}
                          onSelect={setSelectedEvent}
                        />
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <p>
          Built for the HackIllinois 2027 Systems Coding Challenge · data from{" "}
          <a href="https://adonix.hackillinois.org/event/" target="_blank" rel="noreferrer">
            the public event API
          </a>
        </p>
      </footer>

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          isFavorite={favorites.has(selectedEvent.eventId)}
          onToggleFavorite={toggleFavorite}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
