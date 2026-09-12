import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchEvents } from "./events";

/** Stubs both the live URL and the snapshot fallback with the same response. */
function mockFetch(body: unknown, ok = true, statusCode = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, status: statusCode, json: async () => body }))
  );
}

/** Live call fails (e.g. CORS), snapshot succeeds. */
function mockFetchWithFallback(snapshot: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.includes("adonix")) throw new TypeError("Failed to fetch");
      return { ok: true, status: 200, json: async () => snapshot };
    })
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

    const { events, source } = await fetchEvents();

    expect(source).toBe("live");
    expect(events.map((e) => e.eventId)).toEqual(["first", "second"]);
    expect(events[0].name).toBe("Opening");
    // Unknown/absent types fall back to OTHER, and locations are never null.
    expect(events[1].eventType).toBe("OTHER");
    expect(events[1].locations).toEqual([]);
  });

  it("falls back to the build-time snapshot when the live API is unreachable", async () => {
    mockFetchWithFallback({ events: [{ eventId: "cached", name: "Cached" }] });

    const { events, source } = await fetchEvents();

    expect(source).toBe("snapshot");
    expect(events.map((e) => e.eventId)).toEqual(["cached"]);
  });

  it("throws a useful error when both the API and the snapshot fail", async () => {
    mockFetch({}, false, 503);
    await expect(fetchEvents()).rejects.toThrow("503");
  });

  it("throws when the payload is not the expected shape", async () => {
    mockFetch({ oops: true });
    await expect(fetchEvents()).rejects.toThrow("Unexpected response shape");
  });
});
