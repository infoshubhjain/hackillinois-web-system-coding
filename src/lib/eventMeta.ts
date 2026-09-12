import type { EventType } from "../api/events";

/**
 * Display metadata for each event type. `className` maps to a CSS custom
 * property set in the stylesheet, keeping colour decisions in one place.
 */
export const EVENT_TYPE_META: Record<
  EventType,
  { label: string; emoji: string }
> = {
  SPEAKER: { label: "Speaker", emoji: "🐋" },
  WORKSHOP: { label: "Workshop", emoji: "🐙" },
  MEAL: { label: "Meal", emoji: "🍤" },
  MINIEVENT: { label: "Mini-event", emoji: "🐠" },
  OTHER: { label: "Other", emoji: "🐚" },
};
