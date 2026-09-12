import { describe, expect, it } from "vitest";
import type { HackEvent } from "../api/events";
import {
  buildAgenda,
  countByType,
  EMPTY_FILTERS,
  filterEvents,
  findLiveEvents,
  findNextEvent,
  getDays,
  groupByTimeSlot,
} from "./schedule";
import { formatCountdown, formatDuration, getProgress, getStatus } from "./time";

/** 2026-02-27 09:00 CST. */
const FRIDAY_9AM = 1772204400;
const HOUR = 3600;

function makeEvent(overrides: Partial<HackEvent> = {}): HackEvent {
  return {
    eventId: overrides.eventId ?? "e1",
    name: "Opening Ceremony",
    description: "Kick off the hackathon",
    startTime: FRIDAY_9AM,
    endTime: FRIDAY_9AM + HOUR,
    eventType: "SPEAKER",
    locations: [{ description: "Siebel CS 1404", latitude: 40.1, longitude: -88.2 }],
    sponsor: "",
    points: 0,
    isAsync: false,
    isPro: false,
    isMandatory: false,
    menu: [],
    ...overrides,
  };
}

describe("getDays", () => {
  it("produces one chronological tab per calendar day", () => {
    const days = getDays([
      makeEvent({ eventId: "a" }),
      makeEvent({ eventId: "b", startTime: FRIDAY_9AM + HOUR }),
      makeEvent({ eventId: "c", startTime: FRIDAY_9AM + 24 * HOUR }),
    ]);

    expect(days).toHaveLength(2);
    expect(days[0].count).toBe(2);
    expect(days[0].name).toBe("Friday");
    expect(days[1].name).toBe("Saturday");
  });

  it("keeps late-night events on the day they actually start", () => {
    // 11:30 PM Friday Central — naive UTC math would push this to Saturday.
    const [day] = getDays([makeEvent({ startTime: FRIDAY_9AM + 14.5 * HOUR })]);
    expect(day.name).toBe("Friday");
  });
});

describe("filterEvents", () => {
  const events = [
    makeEvent({ eventId: "talk", name: "Keynote", eventType: "SPEAKER" }),
    makeEvent({ eventId: "food", name: "Dinner", eventType: "MEAL" }),
    makeEvent({ eventId: "pro", name: "Pro Kickoff", eventType: "WORKSHOP", isPro: true }),
  ];

  it("returns everything when no filter is set", () => {
    expect(filterEvents(events, EMPTY_FILTERS, new Set())).toHaveLength(3);
  });

  it("matches the query against name, description and room", () => {
    const byRoom = filterEvents(events, { ...EMPTY_FILTERS, query: "siebel" }, new Set());
    expect(byRoom).toHaveLength(3);

    const byName = filterEvents(events, { ...EMPTY_FILTERS, query: "keyNOTE" }, new Set());
    expect(byName.map((e) => e.eventId)).toEqual(["talk"]);
  });

  it("treats multiple type chips as an OR", () => {
    const result = filterEvents(
      events,
      { ...EMPTY_FILTERS, types: ["MEAL", "WORKSHOP"] },
      new Set()
    );
    expect(result.map((e) => e.eventId)).toEqual(["food", "pro"]);
  });

  it("combines filters with AND", () => {
    const result = filterEvents(
      events,
      { ...EMPTY_FILTERS, onlyPro: true, onlyFavorites: true },
      new Set(["pro"])
    );
    expect(result.map((e) => e.eventId)).toEqual(["pro"]);

    expect(
      filterEvents(events, { ...EMPTY_FILTERS, onlyPro: true }, new Set(["food"]))
    ).toHaveLength(1);
  });
});

describe("groupByTimeSlot", () => {
  it("buckets events that start at the same moment", () => {
    const slots = groupByTimeSlot([
      makeEvent({ eventId: "a" }),
      makeEvent({ eventId: "b" }),
      makeEvent({ eventId: "c", startTime: FRIDAY_9AM + HOUR }),
    ]);

    expect(slots).toHaveLength(2);
    expect(slots[0].events.map((e) => e.eventId)).toEqual(["a", "b"]);
    expect(slots[0].label).toBe("9:00 AM");
  });
});

describe("buildAgenda", () => {
  const opening = makeEvent({ eventId: "opening" });
  // Starts 3 hours after the opening ends → a real break.
  const dinner = makeEvent({
    eventId: "dinner",
    startTime: FRIDAY_9AM + 4 * HOUR,
    endTime: FRIDAY_9AM + 5 * HOUR,
  });
  // Starts 15 minutes after dinner → just turnaround, no gap row.
  const talk = makeEvent({
    eventId: "talk",
    startTime: FRIDAY_9AM + 5.25 * HOUR,
    endTime: FRIDAY_9AM + 6 * HOUR,
  });

  it("inserts a break row only for gaps worth showing", () => {
    const rows = buildAgenda([opening, dinner, talk], 0, false);

    expect(rows.map((row) => row.kind)).toEqual(["slot", "gap", "slot", "slot"]);
    const gap = rows[1];
    expect(gap.kind === "gap" && gap.minutes).toBe(180);
  });

  it("marks the reader's position before the next future slot", () => {
    // 30 minutes into the break: "now" belongs just before dinner.
    const rows = buildAgenda(
      [opening, dinner, talk],
      FRIDAY_9AM + 1.5 * HOUR,
      true
    );

    expect(rows.map((row) => row.kind)).toEqual([
      "slot",
      "gap",
      "now",
      "slot",
      "slot",
    ]);
  });

  it("never claims 'now' on a day the reader is not in", () => {
    // Same timestamp, but this is not today's tab.
    expect(
      buildAgenda([opening, dinner], FRIDAY_9AM + 1.5 * HOUR, false).some(
        (row) => row.kind === "now"
      )
    ).toBe(false);

    // Today's tab, but the day is already over.
    expect(
      buildAgenda([opening, dinner], FRIDAY_9AM + 50 * HOUR, true).some(
        (row) => row.kind === "now"
      )
    ).toBe(false);
  });

  it("returns nothing for an empty day", () => {
    expect(buildAgenda([], FRIDAY_9AM, true)).toEqual([]);
  });
});

describe("countByType", () => {
  const events = [
    makeEvent({ eventId: "a", eventType: "MEAL" }),
    makeEvent({ eventId: "b", eventType: "MEAL", isPro: true }),
    makeEvent({ eventId: "c", eventType: "WORKSHOP" }),
  ];

  it("counts what each chip would actually return", () => {
    expect(countByType(events, EMPTY_FILTERS, new Set())).toEqual({
      MEAL: 2,
      WORKSHOP: 1,
    });
  });

  it("respects the other active filters but ignores the type filter itself", () => {
    const counts = countByType(
      events,
      { ...EMPTY_FILTERS, onlyPro: true, types: ["WORKSHOP"] },
      new Set()
    );
    expect(counts).toEqual({ MEAL: 1 });
  });
});

describe("live / upcoming helpers", () => {
  const event = makeEvent();

  it("classifies an event relative to now", () => {
    expect(getStatus(event, FRIDAY_9AM - 60)).toBe("upcoming");
    expect(getStatus(event, FRIDAY_9AM + 60)).toBe("live");
    expect(getStatus(event, FRIDAY_9AM + HOUR)).toBe("past");
  });

  it("reports progress through a live event", () => {
    expect(getProgress(event, FRIDAY_9AM + HOUR / 2)).toBeCloseTo(0.5);
    // Zero-length events should not divide by zero.
    expect(getProgress(makeEvent({ endTime: FRIDAY_9AM }), FRIDAY_9AM)).toBe(1);
  });

  it("finds what is live and what is next", () => {
    const events = [event, makeEvent({ eventId: "later", startTime: FRIDAY_9AM + 2 * HOUR })];
    expect(findLiveEvents(events, FRIDAY_9AM + 60).map((e) => e.eventId)).toEqual(["e1"]);
    expect(findNextEvent(events, FRIDAY_9AM + 60)?.eventId).toBe("later");
    expect(findNextEvent(events, FRIDAY_9AM + 100 * HOUR)).toBeUndefined();
  });
});

describe("formatting", () => {
  it("formats durations and countdowns for humans", () => {
    expect(formatDuration(FRIDAY_9AM, FRIDAY_9AM + 90 * 60)).toBe("1h 30m");
    expect(formatDuration(FRIDAY_9AM, FRIDAY_9AM + 45 * 60)).toBe("45m");
    expect(formatCountdown(FRIDAY_9AM + 30 * 60, FRIDAY_9AM)).toBe("in 30m");
    expect(formatCountdown(FRIDAY_9AM, FRIDAY_9AM + 10)).toBe("starting now");
  });
});
