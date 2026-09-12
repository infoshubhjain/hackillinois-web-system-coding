import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchEvents } from "./events";

function mockFetch(body: unknown, ok = true, statusCode = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, status: statusCode, json: async () => body }))
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchEvents", () => {
  it("sorts events chronologically and fills in missing fields", async () => {
    mockFetch({
      events: [
        { eventId: "second", name: "Closing", startTime: 200, endTime: 300 },
        {
          eventId: "first",
          name: "  Opening  ",
          startTime: 100,
          endTime: 150,
          eventType: "SPEAKER",
        },
      ],
    });

    const events = await fetchEvents();

    expect(events.map((e) => e.eventId)).toEqual(["first", "second"]);
    expect(events[0].name).toBe("Opening");
    // Unknown/absent types fall back to OTHER, and locations are never null.
    expect(events[1].eventType).toBe("OTHER");
    expect(events[1].locations).toEqual([]);
  });

  it("throws a useful error on a non-200 response", async () => {
    mockFetch({}, false, 503);
    await expect(fetchEvents()).rejects.toThrow("503");
  });

  it("throws when the payload is not the expected shape", async () => {
    mockFetch({ oops: true });
    await expect(fetchEvents()).rejects.toThrow("Unexpected response shape");
  });
});
