import type { HourBucket } from "../lib/schedule";
import { formatHourShort } from "../lib/time";

interface DayShapeProps {
  buckets: HourBucket[];
  /** Current hour in Central, or null when the reader isn't in this day. */
  currentHour: number | null;
  onJump: (slotKey: string) => void;
}

/**
 * The day at a glance: one bar per hour, height by how many events start in it.
 *
 * This is the answer to "when is this day actually busy?" — a question the
 * timeline can only answer by scrolling all of it. Each populated hour is a real
 * button that jumps the timeline to that hour, so the chart is navigation too,
 * not an ornament.
 */
export function DayShape({ buckets, currentHour, onJump }: DayShapeProps) {
  if (buckets.length < 2) return null;

  const busiest = Math.max(...buckets.map((bucket) => bucket.count));

  return (
    <section className="rail__group">
      <h2 className="rail__heading">Shape of the day</h2>

      <div className="shape">
        {buckets.map((bucket) => {
          const label = `${bucket.count} event${bucket.count === 1 ? "" : "s"} at ${formatHourShort(bucket.hour)}`;

          return (
            <button
              key={bucket.hour}
              type="button"
              className={`shape__bar ${bucket.hour === currentHour ? "is-now" : ""}`}
              // An empty hour is a fact worth drawing, but nothing to jump to.
              disabled={!bucket.slotKey}
              title={bucket.count ? label : `Nothing at ${formatHourShort(bucket.hour)}`}
              aria-label={bucket.count ? `Jump to ${label}` : undefined}
              onClick={() => bucket.slotKey && onJump(bucket.slotKey)}
              style={
                {
                  // Empty hours keep a visible 6% stub so the gaps read as gaps.
                  "--height": `${bucket.count ? (bucket.count / busiest) * 100 : 6}%`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>

      <p className="shape__axis" aria-hidden="true">
        <span>{formatHourShort(buckets[0].hour)}</span>
        <span>{formatHourShort(buckets[buckets.length - 1].hour)}</span>
      </p>
    </section>
  );
}
