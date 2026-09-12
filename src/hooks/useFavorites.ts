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
      next.has(eventId) ? next.delete(eventId) : next.add(eventId);
      return next;
    });
  }, []);

  return { favorites: ids, toggleFavorite: toggle };
}
