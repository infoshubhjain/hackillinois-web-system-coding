/**
 * Thin client for the public HackIllinois event service.
 * Docs: https://api.docs.hackillinois.org/  (GET /event/ returns all public events)
 */

export const EVENT_TYPES = [
  "SPEAKER",
  "WORKSHOP",
  "MEAL",
  "MINIEVENT",
  "OTHER",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface EventLocation {
  description: string;
  latitude: number;
  longitude: number;
}

/** Shape of a single event as returned by `GET /event/`. */
export interface HackEvent {
  eventId: string;
  name: string;
  description: string;
  /** Unix timestamp in *seconds*. */
  startTime: number;
  /** Unix timestamp in *seconds*. */
  endTime: number;
  eventType: EventType;
  locations: EventLocation[];
  sponsor: string;
  points: number;
  isAsync: boolean;
  isPro: boolean;
  isMandatory: boolean;
  mapImageUrl?: string;
  menu?: string[];
}

const BASE_URL = "https://adonix.hackillinois.org";

/**
 * The API occasionally returns an event with a missing/unknown type or a null
 * `locations` array. Normalizing here keeps every component downstream simple:
 * they can trust the `HackEvent` type instead of defending against the network.
 */
function normalize(raw: Partial<HackEvent>): HackEvent {
  const eventType = (EVENT_TYPES as readonly string[]).includes(
    raw.eventType ?? ""
  )
    ? (raw.eventType as EventType)
    : "OTHER";

  return {
    eventId: raw.eventId ?? crypto.randomUUID(),
    name: raw.name?.trim() || "Untitled event",
    description: raw.description?.trim() ?? "",
    startTime: raw.startTime ?? 0,
    endTime: raw.endTime ?? raw.startTime ?? 0,
    eventType,
    locations: raw.locations ?? [],
    sponsor: raw.sponsor?.trim() ?? "",
    points: raw.points ?? 0,
    isAsync: Boolean(raw.isAsync),
    isPro: Boolean(raw.isPro),
    isMandatory: Boolean(raw.isMandatory),
    mapImageUrl: raw.mapImageUrl || undefined,
    menu: raw.menu?.filter(Boolean) ?? [],
  };
}

/** Fetches every public event, sorted chronologically. */
export async function fetchEvents(signal?: AbortSignal): Promise<HackEvent[]> {
  const response = await fetch(`${BASE_URL}/event/`, { signal });

  if (!response.ok) {
    throw new Error(`Event service responded with ${response.status}`);
  }

  const body: { events?: Partial<HackEvent>[] } = await response.json();
  if (!Array.isArray(body.events)) {
    throw new Error("Unexpected response shape from event service");
  }

  return body.events
    .map(normalize)
    .sort((a, b) => a.startTime - b.startTime || a.name.localeCompare(b.name));
}
