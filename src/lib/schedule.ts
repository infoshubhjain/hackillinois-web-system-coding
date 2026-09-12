import type { EventType, HackEvent } from "../api/events";
import { dayKey, formatDayDate, formatDayName, formatTime } from "./time";

export interface ScheduleFilters {
  query: string;
  types: EventType[];
  onlyFavorites: boolean;
  onlyPro: boolean;
}

export const EMPTY_FILTERS: ScheduleFilters = {
  query: "",
  types: [],
  onlyFavorites: false,
  onlyPro: false,
};

export interface ScheduleDay {
  key: string;
  /** Start timestamp of the first event that day — used for labels. */
  timestamp: number;
  name: string;
  date: string;
  count: number;
}

/** One tab per calendar day present in the feed, in chronological order. */
export function getDays(events: HackEvent[]): ScheduleDay[] {
  const byKey = new Map<string, ScheduleDay>();

  for (const event of events) {
    const key = dayKey(event.startTime);
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byKey.set(key, {
        key,
        timestamp: event.startTime,
        name: formatDayName(event.startTime),
        date: formatDayDate(event.startTime),
        count: 1,
      });
    }
  }

  return [...byKey.values()].sort((a, b) => a.timestamp - b.timestamp);
}

/** Text the search box matches against: title, blurb, room and sponsor. */
function searchableText(event: HackEvent) {
  return [
    event.name,
    event.description,
    event.sponsor,
    ...event.locations.map((location) => location.description),
  ]
    .join(" ")
    .toLowerCase();
}

export function filterEvents(
  events: HackEvent[],
  filters: ScheduleFilters,
  favorites: Set<string>
): HackEvent[] {
  const query = filters.query.trim().toLowerCase();

  return events.filter((event) => {
    if (filters.onlyFavorites && !favorites.has(event.eventId)) return false;
    if (filters.onlyPro && !event.isPro) return false;
    if (filters.types.length && !filters.types.includes(event.eventType)) return false;
    if (query && !searchableText(event).includes(query)) return false;
    return true;
  });
}

export interface TimeSlot {
  key: string;
  label: string;
  events: HackEvent[];
}

/**
 * Groups a day's events by start time so the page reads like a timeline
 * ("9:00 AM → these three things") instead of a flat list of cards.
 */
export function groupByTimeSlot(events: HackEvent[]): TimeSlot[] {
  const slots = new Map<string, TimeSlot>();

  for (const event of events) {
    const key = String(event.startTime);
    const slot = slots.get(key);
    if (slot) {
      slot.events.push(event);
    } else {
      slots.set(key, { key, label: formatTime(event.startTime), events: [event] });
    }
  }

  return [...slots.values()].sort((a, b) => Number(a.key) - Number(b.key));
}

/**
 * A day is rendered as a sequence of rows, not a flat list: time slots,
 * the empty stretches between them, and the reader's current position.
 * Making the gaps explicit is the difference between a timeline and a list —
 * a 10-minute turnaround and a 6-hour overnight break should not look alike.
 */
export type AgendaRow =
  | { kind: "slot"; key: string; label: string; events: HackEvent[] }
  | { kind: "gap"; key: string; minutes: number }
  | { kind: "now"; key: string };

/** Shorter breaks are just turnaround time and aren't worth a row. */
const GAP_THRESHOLD_MINUTES = 45;

export function buildAgenda(
  events: HackEvent[],
  nowSeconds: number,
  showNowMarker: boolean
): AgendaRow[] {
  const slots = groupByTimeSlot(events);
  if (!slots.length) return [];

  const dayStart = Number(slots[0].key);
  const dayEnd = Math.max(...events.map((event) => event.endTime));
  // Only mark "now" when the reader is actually inside this day's span.
  let nowPending =
    showNowMarker && nowSeconds >= dayStart && nowSeconds <= dayEnd;

  const rows: AgendaRow[] = [];
  let previousEnd = 0;

  for (const slot of slots) {
    const start = Number(slot.key);

    if (previousEnd) {
      const gapMinutes = Math.round((start - previousEnd) / 60);
      if (gapMinutes >= GAP_THRESHOLD_MINUTES) {
        rows.push({ kind: "gap", key: `gap-${slot.key}`, minutes: gapMinutes });
      }
    }

    // The marker goes immediately before the first slot still in the future.
    if (nowPending && start > nowSeconds) {
      rows.push({ kind: "now", key: `now-${slot.key}` });
      nowPending = false;
    }

    rows.push({ kind: "slot", ...slot });
    previousEnd = Math.max(previousEnd, ...slot.events.map((e) => e.endTime));
  }

  return rows;
}

/**
 * How many events each type would yield under the *other* active filters.
 * Counting this way keeps the number next to a chip honest: it is exactly what
 * you get if you click it.
 */
export function countByType(
  events: HackEvent[],
  filters: ScheduleFilters,
  favorites: Set<string>
): Record<EventType, number> {
  const base = filterEvents(events, { ...filters, types: [] }, favorites);
  const counts = {} as Record<EventType, number>;

  for (const event of base) {
    counts[event.eventType] = (counts[event.eventType] ?? 0) + 1;
  }

  return counts;
}

/** The next event that has not started yet, for the "up next" banner. */
export function findNextEvent(events: HackEvent[], nowSeconds: number) {
  return events.find((event) => event.startTime > nowSeconds);
}

export function findLiveEvents(events: HackEvent[], nowSeconds: number) {
  return events.filter(
    (event) => event.startTime <= nowSeconds && nowSeconds < event.endTime
  );
}
