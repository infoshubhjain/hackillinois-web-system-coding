import { useEffect } from "react";

interface Shortcuts {
  onSearch: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onClear: () => void;
  /** Shortcuts pause while the detail dialog owns the keyboard. */
  enabled: boolean;
}

/**
 * A schedule is a tool people scan repeatedly, so it gets a keyboard layer:
 *   /        focus search
 *   ← / →    previous / next day
 *   Esc      clear filters
 *
 * Keys are ignored while the user is typing in a field, so "/" inside the
 * search box stays a slash.
 */
export function useShortcuts({
  onSearch,
  onPrevDay,
  onNextDay,
  onClear,
  enabled,
}: Shortcuts) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "/" && !typing) {
        event.preventDefault();
        onSearch();
      } else if (event.key === "ArrowLeft" && !typing) {
        onPrevDay();
      } else if (event.key === "ArrowRight" && !typing) {
        onNextDay();
      } else if (event.key === "Escape") {
        (target as HTMLInputElement | null)?.blur?.();
        onClear();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled, onSearch, onPrevDay, onNextDay, onClear]);
}
