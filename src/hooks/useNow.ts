import { useEffect, useState } from "react";

/**
 * Current unix time in seconds, re-rendering every `intervalMs`.
 * Drives the "live now" badges, progress bars and countdowns.
 */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      intervalMs
    );
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
