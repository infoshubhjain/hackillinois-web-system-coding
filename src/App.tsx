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
  getDayShape,
  EMPTY_FILTERS,
  filterEvents,
  findFreeBlocks,
  findLiveEvents,
  findNextEvent,
  getDays,
  type ScheduleFilters,
} from "./lib/schedule";
import { dayKey, formatDuration, formatTime, getHour } from "./lib/time";
import { withViewTransition } from "./lib/viewTransition";

// Schedule page: day tabs + filter rail around an hour-by-hour timeline,
// with a live-now banner, an open-time finder, and locally persisted stars.
export default function App() {
  const { events, status, error, updatedAt, source, refresh } = useEvents();
  const { favorites, toggleFavorite, justStarred } = useFavorites();
  const { selectedEvent, morphId, open, close } = useEventDialog();
  const now = useNow();
  useAmbient();

  const [filters, setFilters] = useState<ScheduleFilters>(EMPTY_FILTERS);
  const [activeDay, setActiveDay] = useState<string>("");
  const [minFreeMinutes, setMinFreeMinutes] = useState(60);
  const searchRef = useRef<HTMLInputElement>(null);

  /**
   * Switching days replaces the entire timeline, so it gets a cross-dissolve
   * instead of a hard cut — it's the most-used control on the page.
   */
  const selectDay = useCallback(
    (key: string) => withViewTransition(() => setActiveDay(key), "day"),
    []
  );

  const jumpToHour = useCallback((slotKey: string) => {
    document
      .getElementById(`slot-${slotKey}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

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

  // Whole-day events before filtering: the rail overviews the day itself,
  // not the current query.
  const activeDayEvents = useMemo(
    () => events.filter((event) => dayKey(event.startTime) === activeDay),
    [events, activeDay]
  );
  const isToday = activeDay === dayKey(now);

  // Rows = time slots + the breaks between them + the reader's position.
  const agenda = useMemo(
    () => buildAgenda(dayEvents, now, isToday),
    [dayEvents, now, isToday]
  );

  const typeCounts = useMemo(
    () => countByType(activeDayEvents, filters, favorites),
    [activeDayEvents, filters, favorites]
  );

  const shape = useMemo(() => getDayShape(activeDayEvents), [activeDayEvents]);

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

  // Open hacking time: the inverse of the reader's starred day. Clipped to
  // "now" when viewing today so elapsed time never shows as available.
  const freeBlocks = useMemo(() => {
    if (!activeDayEvents.length) return [];
    const start = Math.min(...activeDayEvents.map((e) => e.startTime));
    const end = Math.max(...activeDayEvents.map((e) => e.endTime));
    const starred = activeDayEvents.filter((e) => favorites.has(e.eventId));
    return findFreeBlocks(
      starred,
      start,
      end,
      minFreeMinutes,
      isToday ? now : 0
    );
  }, [activeDayEvents, favorites, minFreeMinutes, isToday, now]);

  // Re-arm the scroll-reveal animation whenever the visible list changes.
  useReveal([agenda, status]);

  const stepDay = useCallback(
    (direction: -1 | 1) => {
      const index = days.findIndex((day) => day.key === activeDay);
      const next = days[index + direction];
      if (next) selectDay(next.key);
    },
    [days, activeDay, selectDay]
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
              onSelectDay={selectDay}
              filters={filters}
              onChangeFilters={setFilters}
              typeCounts={typeCounts}
              favoriteCount={favorites.size}
              proCount={proCount}
              dayCount={dayEvents.length}
              totalCount={visibleEvents.length}
              shape={shape}
              currentHour={isToday ? getHour(now) : null}
              onJumpToHour={jumpToHour}
              freeBlocks={freeBlocks}
              minFreeMinutes={minFreeMinutes}
              onChangeMinFree={setMinFreeMinutes}
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
                      <li key={row.key} className="slot" id={`slot-${row.key}`}>
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
                              justStarred={justStarred === event.eventId}
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
