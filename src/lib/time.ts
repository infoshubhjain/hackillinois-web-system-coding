import type { HackEvent } from "../api/events";

/** All HackIllinois events are scheduled in Central Time, wherever the user is. */
const TIME_ZONE = "America/Chicago";

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const dayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  timeZone: TIME_ZONE,
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: TIME_ZONE,
});

/** `h23` so midnight is hour 0, not 24 — some locales format it either way. */
const hourFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

/** `en-CA` gives a sortable `YYYY-MM-DD` key in the target time zone. */
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

export const toDate = (unixSeconds: number) => new Date(unixSeconds * 1000);

export const formatTime = (unixSeconds: number) =>
  timeFormat.format(toDate(unixSeconds));

export const formatTimeRange = (start: number, end: number) =>
  start === end ? formatTime(start) : `${formatTime(start)} – ${formatTime(end)}`;

export const dayKey = (unixSeconds: number) =>
  dayKeyFormat.format(toDate(unixSeconds));

export const formatDayName = (unixSeconds: number) =>
  dayFormat.format(toDate(unixSeconds));

export const formatDayDate = (unixSeconds: number) =>
  dateFormat.format(toDate(unixSeconds));

/** Hour of the day (0–23) in Central, for the day-shape strip. */
export const getHour = (unixSeconds: number) =>
  Number(hourFormat.format(toDate(unixSeconds)));

/** "2p", "12a" — compact enough to label a 10px-wide bar. */
export function formatHourShort(hour: number) {
  const suffix = hour < 12 ? "a" : "p";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}${suffix}`;
}

export function formatDuration(start: number, end: number) {
  const minutes = Math.max(0, Math.round((end - start) / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours}h ${rest}m`;
  if (hours) return `${hours}h`;
  return `${rest}m`;
}

export type EventStatus = "past" | "live" | "upcoming";

export function getStatus(event: HackEvent, nowSeconds: number): EventStatus {
  if (nowSeconds >= event.endTime) return "past";
  if (nowSeconds >= event.startTime) return "live";
  return "upcoming";
}

/** Fraction (0–1) of a live event that has already elapsed. */
export function getProgress(event: HackEvent, nowSeconds: number) {
  const span = event.endTime - event.startTime;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (nowSeconds - event.startTime) / span));
}

/** "in 2h 15m" / "starting now" — used for the next-up banner. */
export function formatCountdown(targetSeconds: number, nowSeconds: number) {
  const delta = targetSeconds - nowSeconds;
  if (delta <= 0) return "starting now";

  const minutes = Math.floor(delta / 60);
  const days = Math.floor(minutes / (60 * 24));
  if (days >= 1) return `in ${days}d ${Math.floor((minutes % 1440) / 60)}h`;

  const hours = Math.floor(minutes / 60);
  if (hours >= 1) return `in ${hours}h ${minutes % 60}m`;
  return `in ${Math.max(1, minutes)}m`;
}
