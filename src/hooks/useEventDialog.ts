import { useCallback, useState } from "react";
import { flushSync } from "react-dom";
import type { HackEvent } from "../api/events";
import { supportsViewTransition, withViewTransition } from "../lib/viewTransition";

/**
 * Owns the detail dialog, and morphs the clicked card into it.
 *
 * The trick is that only one element may carry a given `view-transition-name`
 * at a time. So the card is tagged *before* the transition starts (it becomes
 * the "old" snapshot), and the update inside the transition hands that same name
 * to the dialog (the "new" snapshot); the browser interpolates between the two.
 *
 * Browsers without the API get the CSS entrance in `app.css`, and so does
 * anyone who asked for reduced motion.
 */
export function useEventDialog() {
  const [selectedEvent, setSelectedEvent] = useState<HackEvent | null>(null);
  const [morphId, setMorphId] = useState<string | null>(null);

  const open = useCallback((event: HackEvent) => {
    if (!supportsViewTransition()) {
      setSelectedEvent(event);
      return;
    }

    // Tag the source card, then swap in the dialog under the same name.
    flushSync(() => setMorphId(event.eventId));
    withViewTransition(() => setSelectedEvent(event));
  }, []);

  const close = useCallback(() => {
    if (!supportsViewTransition()) {
      setSelectedEvent(null);
      setMorphId(null);
      return;
    }

    // Release the name only once the dialog has finished collapsing back.
    withViewTransition(() => setSelectedEvent(null))?.finished.finally(() =>
      setMorphId(null)
    );
  }, []);

  return { selectedEvent, morphId, open, close };
}
