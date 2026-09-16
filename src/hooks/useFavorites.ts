import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hackillinois:starred-events";

function readStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    // Corrupted or unavailable storage (e.g. private mode) — start clean.
    return [];
  }
}

/**
 * Starred event ids, persisted to localStorage so a hacker's personal agenda
 * survives a refresh. No auth required, which matches the challenge scope.
 */
export function useFavorites() {
  const [ids, setIds] = useState<Set<string>>(() => new Set(readStored()));
  /** Id of the event starred in the last moment, so only it plays the burst. */
  const [justStarred, setJustStarred] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      /* ignore quota / private-mode failures */
    }
  }, [ids]);

  const toggle = useCallback((eventId: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      // Celebrate adding, not removing.
      setJustStarred(next.has(eventId) ? eventId : null);
      return next;
    });
  }, []);

  // Without this the burst would replay on every re-mount — starring is a
  // moment, not a permanent state of the button.
  useEffect(() => {
    if (!justStarred) return;
    const timer = setTimeout(() => setJustStarred(null), 600);
    return () => clearTimeout(timer);
  }, [justStarred]);

  return { favorites: ids, toggleFavorite: toggle, justStarred };
}
