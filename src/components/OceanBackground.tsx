import { useMemo } from "react";

interface Particle {
  id: number;
  kind: "bubble" | "snow";
  depth: "near" | "far";
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
}

/**
 * The underwater scene: water column, dive light, caustics, god rays, a
 * two-tier particle field (near = crisp bubbles, far = blurred marine snow),
 * vignette and film grain.
 *
 * Everything here is decorative and hidden from assistive tech. Particle
 * geometry is randomized once on mount so no two visits look identical;
 * splitting them into depth tiers is what sells the sense of volume.
 */
export function OceanBackground({ count = 34 }: { count?: number }) {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, id) => {
        const far = id % 3 !== 0;
        return {
          id,
          kind: far ? "snow" : "bubble",
          depth: far ? "far" : "near",
          left: Math.random() * 100,
          // Far particles are smaller and slower: parallax by size and speed.
          size: far ? 2 + Math.random() * 4 : 5 + Math.random() * 16,
          duration: far ? 26 + Math.random() * 26 : 14 + Math.random() * 16,
          delay: Math.random() * -45,
          drift: (Math.random() - 0.5) * (far ? 40 : 110),
          opacity: far ? 0.22 + Math.random() * 0.2 : 0.45 + Math.random() * 0.35,
        };
      }),
    [count]
  );

  return (
    <>
      <div className="ocean" aria-hidden="true">
        <div className="ocean__water" />
        <div className="ocean__caustics" />
        <div className="ocean__rays" />
        <div className="ocean__lamp" />

        {particles.map((particle) => (
          <span
            key={particle.id}
            className={`particle particle--${particle.kind}`}
            data-depth={particle.depth}
            style={
              {
                left: `${particle.left}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animationDuration: `${particle.duration}s`,
                animationDelay: `${particle.delay}s`,
                "--drift": `${particle.drift}px`,
                "--peak-opacity": particle.opacity,
              } as React.CSSProperties
            }
          />
        ))}

        <div className="ocean__vignette" />
      </div>

      <div className="grain" aria-hidden="true" />
    </>
  );
}
