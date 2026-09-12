import { useCallback, useState } from "react";
import { flushSync } from "react-dom";
import type { HackEvent } from "../api/events";

/** Minimal typing for the View Transitions API (not in every TS DOM lib yet). */
type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

function canMorph() {
  return (
    typeof document !== "undefined" &&
    typeof (document as ViewTransitionDocument).startViewTransition === "function" &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Owns the detail dialog, and morphs the clicked card into it using the
 * View Transitions API.
 *
 * The trick is that only one element may carry a given `view-transition-name`
 * at a time. So the card is tagged *before* the transition starts (it becomes
 * the "old" snapshot), and the update inside `startViewTransition` hands that
 * same name to the dialog (the "new" snapshot); the browser interpolates
 * between the two. `flushSync` is required because the browser snapshots the
 * DOM synchronously — React's default async rendering would miss the frame.
 *
 * Browsers without the API (Firefox, older Safari) just get the CSS entrance
 * animation, and so does anyone who asked for reduced motion.
 */
export function useEventDialog() {
  const [selectedEvent, setSelectedEvent] = useState<HackEvent | null>(null);
  const [morphId, setMorphId] = useState<string | null>(null);

  const open = useCallback((event: HackEvent) => {
    if (!canMorph()) {
      setSelectedEvent(event);
      return;
    }

    // Tag the source card, then swap in the dialog under the same name.
    flushSync(() => setMorphId(event.eventId));
    (document as ViewTransitionDocument).startViewTransition!(() =>
      flushSync(() => setSelectedEvent(event))
    );
  }, []);

  const close = useCallback(() => {
    if (!canMorph()) {
      setSelectedEvent(null);
      setMorphId(null);
      return;
    }

    const transition = (document as ViewTransitionDocument).startViewTransition!(
      () => flushSync(() => setSelectedEvent(null))
    );
    // Release the name only once the dialog has finished collapsing back.
    transition.finished.finally(() => setMorphId(null));
  }, []);

  return { selectedEvent, morphId, open, close };
}
