import type { ScheduleDay } from "../lib/schedule";

interface DayTabsProps {
  days: ScheduleDay[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function DayTabs({ days, activeKey, onSelect }: DayTabsProps) {
  if (days.length === 0) return null;

  return (
    <div className="daytabs" role="tablist" aria-label="Schedule days">
      {days.map((day) => (
        <button
          key={day.key}
          type="button"
          role="tab"
          aria-selected={day.key === activeKey}
          className={`daytab ${day.key === activeKey ? "is-active" : ""}`}
          onClick={() => onSelect(day.key)}
        >
          <span className="daytab__name">{day.name}</span>
          <span className="daytab__date">{day.date}</span>
        </button>
      ))}
    </div>
  );
}
