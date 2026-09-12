import { useEffect } from "react";

/**
 * Reveal-on-scroll. Any element marked `data-reveal` starts translated and
 * transparent, then gets `data-revealed` the first time it enters the viewport
 * (see app.css). One shared IntersectionObserver handles the whole page, and
 * elements are unobserved after firing so nothing animates twice.
 *
 * `deps` re-runs the scan when the rendered list changes (new day, new filter).
 */
export function useReveal(deps: unknown[]) {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(
      "[data-reveal]:not([data-revealed])"
    );
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          observer.unobserve(entry.target);
        }
      },
      // Fire slightly before the element is fully on screen.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
