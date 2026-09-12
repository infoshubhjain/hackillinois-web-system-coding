import { useMemo } from "react";

/**
 * Purely decorative layer: sunlight rays from the surface plus a drifting
 * bubble field. Rendered once behind the app and hidden from screen readers.
 * Bubble geometry is randomized on mount so no two visits look identical.
 */
export function OceanBackground({ bubbleCount = 22 }: { bubbleCount?: number }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: bubbleCount }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        size: 4 + Math.random() * 18,
        duration: 12 + Math.random() * 18,
        delay: Math.random() * -30,
        drift: (Math.random() - 0.5) * 80,
      })),
    [bubbleCount]
  );

  return (
    <div className="ocean" aria-hidden="true">
      <div className="ocean__rays" />
      <div className="ocean__bubbles">
        {bubbles.map((bubble) => (
          <span
            key={bubble.id}
            className="bubble"
            style={
              {
                left: `${bubble.left}%`,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                animationDuration: `${bubble.duration}s`,
                animationDelay: `${bubble.delay}s`,
                "--drift": `${bubble.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
