import { flushSync } from "react-dom";

/** Minimal typing for the View Transitions API (not in every TS DOM lib yet). */
type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

export function supportsViewTransition() {
  return (
    typeof document !== "undefined" &&
    typeof (document as ViewTransitionDocument).startViewTransition === "function" &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Runs a React state update inside a view transition.
 *
 * `flushSync` is required: the browser snapshots the DOM synchronously when the
 * callback returns, so React's default async rendering would miss the frame and
 * the transition would animate from a state to itself.
 *
 * `name` is written to `<html data-transition>` so CSS can style each kind of
 * transition separately — the day swap should cross-dissolve the page, while the
 * card→dialog morph must leave the page alone and only move the panel.
 *
 * Callers get the plain update when the API is missing or motion is reduced.
 */
export function withViewTransition(update: () => void, name?: string) {
  if (!supportsViewTransition()) {
    update();
    return;
  }

  if (name) document.documentElement.dataset.transition = name;

  const transition = (document as ViewTransitionDocument).startViewTransition!(() =>
    flushSync(update)
  );

  transition.finished.finally(() => {
    if (name) delete document.documentElement.dataset.transition;
  });

  return transition;
}
