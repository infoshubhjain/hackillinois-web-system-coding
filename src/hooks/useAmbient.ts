import { useEffect } from "react";

/**
 * Feeds the CSS scene two live values, written as custom properties on <html>:
 *
 *   --scroll     0 → 1 depth through the page (dims the water, parallaxes the hero)
 *   --pointer-x/y  cursor position for the "dive light"
 *
 * Both are written inside a rAF so a fast scroll or mouse sweep still costs at
 * most one style write per frame, and neither triggers a React re-render.
 */
export function useAmbient() {
  useEffect(() => {
    const root = document.documentElement;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let scroll = 0;
    let pointer: { x: number; y: number } | null = null;

    const flush = () => {
      frame = 0;
      root.style.setProperty("--scroll", scroll.toFixed(3));
      if (pointer) {
        root.style.setProperty("--pointer-x", `${pointer.x}px`);
        root.style.setProperty("--pointer-y", `${pointer.y}px`);
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const onScroll = () => {
      const max = document.body.scrollHeight - innerHeight;
      scroll = max > 0 ? Math.min(1, scrollY / max) : 0;
      schedule();
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };

    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", onScroll);
      removeEventListener("pointermove", onPointerMove);
    };
  }, []);
}
