# 🌊 HackIllinois Schedule — Web Challenge

An ocean-themed schedule page for HackIllinois, built with **React + TypeScript + Vite**
and powered by the public [HackIllinois event API](https://adonix.hackillinois.org/event/).

Submission for the **HackIllinois 2027 Systems Coding Challenge (Web track)**.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests (vitest)
npm run build    # type-check + production build
```

No API key or auth needed — the event service endpoint is public.

## What it does

| Feature | Why it's here |
| --- | --- |
| **Day tabs** (Fri / Sat / Sun) | 41 events across three days is unreadable as one list. Tabs default to *today* if the hackathon is running, otherwise to day one. |
| **Timeline layout** | Events are grouped by start time, so the page reads as "9:00 AM → these three things" instead of a flat feed. |
| **"Happening now" / "Up next" banner** | The question most attendees actually open a schedule to answer. Updates every 30s, always reflects the real schedule (never the active filters). |
| **Live progress bar** | In-progress events show how much time is left at a glance. |
| **Search** | Matches title, description, room and sponsor — so "Siebel 1404" or "Caterpillar" both work. |
| **Type / Pro / starred filters** | Chips combine with AND across categories, OR within the type list. |
| **★ My schedule** | Starred events persist in `localStorage`, giving a personal agenda with no login (auth was out of scope). |
| **Event detail dialog** | Full description, clickable map coordinates, the official floor-map image, meal menus, and an *Add to Google Calendar* link. |
| **Resilient data layer** | Skeleton loaders, an error state with retry, silent refresh every 5 minutes, and a manual refresh with a "last updated" stamp. Background refreshes keep the old data on screen instead of flashing a spinner. |
| **Accessibility** | Real buttons everywhere, `aria-pressed` on toggles, `aria-live` result count, Escape-to-close + focus management in the dialog, visible focus rings, and `prefers-reduced-motion` support. |

## Project structure

```
src/
  api/events.ts          fetch + normalize the event service response
  hooks/
    useEvents.ts         loading/error/refresh state machine + polling
    useFavorites.ts      starred events, persisted to localStorage
    useNow.ts            ticking clock that drives live badges
  lib/
    schedule.ts          day tabs, filtering, time-slot grouping  (pure)
    time.ts              Central-Time formatting, status, countdowns (pure)
    eventMeta.ts         per-type label + emoji
  components/            Header, DayTabs, FilterBar, EventCard,
                         EventDetail, Feedback, OceanBackground
  styles/                theme.css (tokens + ocean backdrop), app.css
  App.tsx                composes state → derived data → UI
```

### Design notes

- **All schedule logic is pure and lives in `lib/`.** Components only render, which is
  what makes the 14 unit tests possible without mounting React or mocking a DOM.
- **Time zone is pinned to `America/Chicago`.** HackIllinois is a Central-Time event, so
  a hacker checking the schedule from another time zone still sees the room's clock.
  Day bucketing uses `Intl.DateTimeFormat` rather than UTC math — otherwise an 11:30 PM
  Friday event lands on Saturday's tab (there's a regression test for exactly that).
- **The API response is normalized once, at the edge.** Missing `locations`, unknown
  `eventType` values and untrimmed names are fixed in `api/events.ts` so no component
  has to defend against the network.
- **The ocean theme is pure CSS.** Depth gradient, drifting light rays, a randomized
  bubble field and an SVG wave — no image assets, no animation library, and all of it
  disabled under `prefers-reduced-motion`.

## Testing

```bash
npm test
```

Covers day bucketing (including the late-night timezone edge case), filter combination
logic, time-slot grouping, live/upcoming classification, duration + countdown
formatting, and the API client's sorting, normalization and error paths.

## Tech + sources

- React 19, TypeScript, Vite, Vitest
- Data: `GET https://adonix.hackillinois.org/event/` ([API docs](https://api.docs.hackillinois.org/))
- `Intl.DateTimeFormat` time-zone formatting — [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- Google Calendar template URL parameters — [documented format](https://developers.google.com/calendar)
- AI assistance (Claude) was used to speed up CSS scaffolding and boilerplate; all
  architecture, data modeling and logic decisions are my own and I'm happy to walk
  through any line of it.
