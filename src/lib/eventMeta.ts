import type { EventType } from "../api/events";
import type { IconName } from "../components/Icon";

/**
 * Display metadata per event type. Icons come from the local set (never emoji)
 * and each type owns one accent colour, referenced by CSS as `--accent`.
 */
export const EVENT_TYPE_META: Record<
  EventType,
  { label: string; icon: IconName }
> = {
  SPEAKER: { label: "Speaker", icon: "mic" },
  WORKSHOP: { label: "Workshop", icon: "terminal" },
  MEAL: { label: "Meal", icon: "bowl" },
  MINIEVENT: { label: "Mini-event", icon: "sparkle" },
  OTHER: { label: "Other", icon: "compass" },
};
