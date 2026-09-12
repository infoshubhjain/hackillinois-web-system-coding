import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState, ErrorState, ScheduleSkeleton } from "./components/Feedback";
import { EventCard } from "./components/EventCard";
import { EventDetail } from "./components/EventDetail";
import { Header } from "./components/Header";
import { Icon } from "./components/Icon";
import { OceanBackground } from "./components/OceanBackground";
import { Rail } from "./components/Rail";
import { useAmbient } from "./hooks/useAmbient";
import { useEventDialog } from "./hooks/useEventDialog";
import { useEvents } from "./hooks/useEvents";
import { useFavorites } from "./hooks/useFavorites";
import { useNow } from "./hooks/useNow";
import { useReveal } from "./hooks/useReveal";
import { useShortcuts } from "./hooks/useShortcuts";
import {
  buildAgenda,
  countByType,
  EMPTY_FILTERS,
  filterEvents,
  findLiveEvents,
  findNextEvent,
  getDays,
  type ScheduleFilters,
} from "./lib/schedule";
import { dayKey, formatDuration, formatTime } from "./lib/time";

export default function App() {
  const { events, status, error, updatedAt, source, refresh } = useEvents();
  const { favorites, toggleFavorite } = useFavorites();
  const { selectedEvent, morphId, open, close } = useEventDialog();
  const now = useNow();
  useAmbient();

  const [filters, setFilters] = useState<ScheduleFilters>(EMPTY_FILTERS);
  const [activeDay, setActiveDay] = useState<string>("");
  const searchRef = useRef<HTMLInputElement>(null);

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

  // Rows = time slots + the breaks between them + the reader's position.
  const agenda = useMemo(
    () => buildAgenda(dayEvents, now, activeDay === dayKey(now)),
    [dayEvents, now, activeDay]
  );

  const typeCounts = useMemo(
    () => countByType(events.filter((e) => dayKey(e.startTime) === activeDay), filters, favorites),
    [events, activeDay, filters, favorites]
  );

  const proCount = useMemo(
    () => events.filter((event) => event.isPro).length,
    [events]
  );

  const roomCount = useMemo(
    () =>
      new Set(
        events.flatMap((event) =>
          event.locations.map((location) => location.description.trim())
        )
      ).size,
    [events]
  );

  // The banner always reflects the real schedule, never the current filters.
  const liveEvents = useMemo(() => findLiveEvents(events, now), [events, now]);
  const nextEvent = useMemo(() => findNextEvent(events, now), [events, now]);

  // Re-arm the scroll-reveal animation whenever the visible list changes.
  useReveal([agenda, status]);

  const stepDay = useCallback(
    (direction: -1 | 1) => {
      const index = days.findIndex((day) => day.key === activeDay);
      const next = days[index + direction];
      if (next) setActiveDay(next.key);
    },
    [days, activeDay]
  );

  useShortcuts({
    onSearch: () => searchRef.current?.focus(),
    onPrevDay: () => stepDay(-1),
    onNextDay: () => stepDay(1),
    onClear: () => setFilters(EMPTY_FILTERS),
    enabled: !selectedEvent,
  });

  return (
    <div className="app">
      <OceanBackground />

      <Header
        now={now}
        liveEvents={liveEvents}
        nextEvent={nextEvent}
        totalEvents={events.length}
        dayCount={days.length}
        roomCount={roomCount}
        updatedAt={updatedAt}
        source={source}
        onRefresh={refresh}
        onSelectEvent={open}
      />

      <main className="content" id="schedule">
        {status === "loading" && <ScheduleSkeleton />}

        {status === "error" && (
          <ErrorState message={error ?? "Unknown error"} onRetry={refresh} />
        )}

        {status === "ready" && (
          <div className="workspace">
            <Rail
              ref={searchRef}
              days={days}
              activeDay={activeDay}
              onSelectDay={setActiveDay}
              filters={filters}
              onChangeFilters={setFilters}
              typeCounts={typeCounts}
              favoriteCount={favorites.size}
              proCount={proCount}
              dayCount={dayEvents.length}
              totalCount={visibleEvents.length}
            />

            <section className="schedule" aria-label="Events">
              {agenda.length === 0 ? (
                <EmptyState message="No events match these filters on this day. Try another day, or reset the filters." />
              ) : (
                <ol className="timeline">
                  {agenda.map((row) => {
                    if (row.kind === "gap") {
                      return (
                        <li key={row.key} className="gap" data-reveal>
                          <span className="gap__rule" aria-hidden="true" />
                          <span className="gap__label">
                            {formatDuration(0, row.minutes * 60)} break
                          </span>
                        </li>
                      );
                    }

                    if (row.kind === "now") {
                      return (
                        <li key={row.key} className="nowline">
                          <span className="nowline__dot" aria-hidden="true" />
                          <span className="nowline__label">
                            You are here · {formatTime(now)}
                          </span>
                        </li>
                      );
                    }

                    return (
                      <li key={row.key} className="slot">
                        <div className="slot__time" data-reveal>
                          <span className="slot__node" aria-hidden="true" />
                          <span className="slot__label">{row.label}</span>
                        </div>
                        <div className="slot__events">
                          {row.events.map((event, index) => (
                            <EventCard
                              key={event.eventId}
                              event={event}
                              index={index}
                              now={now}
                              isFavorite={favorites.has(event.eventId)}
                              isMorphing={morphId === event.eventId && !selectedEvent}
                              onToggleFavorite={toggleFavorite}
                              onSelect={open}
                            />
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>
          <Icon name="compass" size={14} /> Built for the HackIllinois 2027 Systems
          Coding Challenge · data from{" "}
          <a
            href="https://adonix.hackillinois.org/event/"
            target="_blank"
            rel="noreferrer"
          >
            the public event API
          </a>
        </p>
        <p className="footer__keys">
          <kbd>/</kbd> search <kbd>←</kbd> <kbd>→</kbd> change day <kbd>Esc</kbd>{" "}
          reset
        </p>
      </footer>

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          isFavorite={favorites.has(selectedEvent.eventId)}
          onToggleFavorite={toggleFavorite}
          onClose={close}
        />
      )}
    </div>
  );
}
