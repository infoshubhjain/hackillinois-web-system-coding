/**
 * Hand-drawn 24×24 icon set on a single stroke weight.
 *
 * Deliberately not emoji: emoji render differently on every OS, can't inherit
 * `currentColor`, and refuse to sit on a text baseline. A tiny inline set costs
 * ~1 kB, colours itself from the surrounding text, and keeps the whole UI on
 * one visual language.
 */

export type IconName =
  | "mic"
  | "terminal"
  | "bowl"
  | "sparkle"
  | "compass"
  | "search"
  | "pin"
  | "star"
  | "clock"
  | "close"
  | "refresh"
  | "arrowDown"
  | "calendar"
  | "sonar";

const PATHS: Record<IconName, React.ReactNode> = {
  // Speaker sessions.
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11.5a7 7 0 0 0 14 0" />
      <path d="M12 18.5V21" />
    </>
  ),
  // Workshops — a prompt, because they are hands-on and technical.
  terminal: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M7.5 10l2.5 2.5-2.5 2.5" />
      <path d="M13 15h3.5" />
    </>
  ),
  // Meals.
  bowl: (
    <>
      <path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0z" />
      <path d="M6 20h12" />
      <path d="M9.5 3.5c0 1.6 1.2 1.6 1.2 3.2" />
      <path d="M13.5 4.5c0 1.2.9 1.2.9 2.4" />
    </>
  ),
  // Mini-events.
  sparkle: (
    <>
      <path d="M12 3.2l1.9 5.4 5.4 1.9-5.4 1.9-1.9 5.4-1.9-5.4L4.7 10.5l5.4-1.9z" />
      <path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </>
  ),
  // Everything else.
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.2 8.8l-1.9 4.5-4.5 1.9 1.9-4.5z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M15.8 15.8L20.5 20.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.8-5.6 6.8-10.4A6.8 6.8 0 0 0 5.2 10.6C5.2 15.4 12 21 12 21z" />
      <circle cx="12" cy="10.4" r="2.4" />
    </>
  ),
  star: (
    <path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.85 6.8 19.6l1-5.75-4.2-4.1 5.8-.85z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.3l3.4 2" />
    </>
  ),
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20.5 3.5V8H16" />
    </>
  ),
  arrowDown: (
    <>
      <path d="M12 4.5v14" />
      <path d="M6.5 13L12 18.5 17.5 13" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10.5h17" />
    </>
  ),
  // Empty state: a sonar ping finding nothing.
  sonar: (
    <>
      <circle cx="12" cy="12" r="1.6" />
      <path d="M7.4 16.6a6.5 6.5 0 0 1 0-9.2" />
      <path d="M16.6 7.4a6.5 6.5 0 0 1 0 9.2" />
      <path d="M4.2 19.8a11 11 0 0 1 0-15.6" />
      <path d="M19.8 4.2a11 11 0 0 1 0 15.6" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  /** Icons are decorative by default; pass a label to expose one to a reader. */
  label?: string;
  className?: string;
  filled?: boolean;
}

export function Icon({ name, size = 16, label, className, filled }: IconProps) {
  return (
    <svg
      className={`icon ${className ?? ""}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
