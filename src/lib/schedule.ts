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

/** The next event that has not started yet, for the "up next" banner. */
export function findNextEvent(events: HackEvent[], nowSeconds: number) {
  return events.find((event) => event.startTime > nowSeconds);
}

export function findLiveEvents(events: HackEvent[], nowSeconds: number) {
  return events.filter(
    (event) => event.startTime <= nowSeconds && nowSeconds < event.endTime
  );
}
