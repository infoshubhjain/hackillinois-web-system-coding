import { useCallback, useEffect, useState } from "react";
import { fetchEvents, type HackEvent } from "../api/events";

interface EventsState {
  events: HackEvent[];
  status: "loading" | "ready" | "error";
  error: string | null;
  /** When the last successful fetch completed. */
  updatedAt: number | null;
}

/** Quietly re-fetch on an interval so a page left open overnight stays correct. */
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useEvents() {
  const [state, setState] = useState<EventsState>({
    events: [],
    status: "loading",
    error: null,
    updatedAt: null,
  });

  const load = useCallback(async (signal?: AbortSignal) => {
    setState((prev) => ({
      ...prev,
      // Keep already-rendered events on screen while a background refresh runs.
      status: prev.events.length ? prev.status : "loading",
    }));

    try {
      const events = await fetchEvents(signal);
      if (signal?.aborted) return;
      setState({ events, status: "ready", error: null, updatedAt: Date.now() });
    } catch (error) {
      if (signal?.aborted || (error as Error).name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        status: prev.events.length ? "ready" : "error",
        error: (error as Error).message,
      }));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);

    const timer = setInterval(() => load(controller.signal), REFRESH_INTERVAL_MS);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [load]);

  return { ...state, refresh: () => load() };
}
