# 🌊 HackIllinois Schedule — Web Challenge

An ocean-themed schedule page for HackIllinois, built with **React + TypeScript + Vite**
and powered by the public [HackIllinois event API](https://adonix.hackillinois.org/event/).

Submission for the **HackIllinois 2027 Systems Coding Challenge (Web track)**.

**Live demo:** https://infoshubhjain.github.io/hackillinois-web-system-coding/

## Quick start

```bash
./start.sh       # installs deps if needed, starts dev server, opens the browser
```

or manually:

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests (vitest)
npm run build    # type-check + production build
```

No API key or auth needed — the event service endpoint is public.

### A note on the live demo and CORS

`adonix.hackillinois.org` only returns `Access-Control-Allow-Origin` for `localhost`
and `hackillinois.org`, so a browser on `github.io` is blocked from calling it directly.
Rather than hide that, the client tries the live API first and falls back to an
`events.json` snapshot that CI fetches at build time (refreshed daily by a cron
workflow); the header then labels the data as a *cached snapshot*. **Running locally
hits the real API live.**

## What it does

| Feature | Why it's here |
| --- | --- |
| **Editorial control rail** | Search, days and type filters live in one persistent sidebar. Every filter shows a live count of exactly what clicking it returns, and a filter that would return nothing is disabled rather than silently emptying the page. |
| **Timeline with real gaps** | Events are grouped by start time, and the empty stretches between them are drawn as explicit "3h break" rows. A list that hides its gaps makes a 10-minute turnaround and an overnight break look identical. |
| **"You are here" marker** | When the active day is today, a live marker is inserted at the reader's exact position in the schedule — and never on a day they aren't in. |
| **Duration to scale** | One bar per card does both jobs: its width is the event's length, its fill is how much has elapsed. A 30-minute talk and a 3-hour expo are distinguishable before you read a word; zero-length deadlines get no bar and no "0m". |
| **Shape of the day** | A density strip in the rail — one bar per hour, height by event count, the current hour marked. Answers "when is this day busy?" without scrolling the timeline, and every populated hour is a button that jumps there. |
| **Happening now / up next** | The question people actually open a schedule to answer, updated every 30s and always reflecting the real schedule rather than the active filters. |
| **Open time finder** | The inverse schedule: open blocks between your starred events, clipped to "now" on today's tab, with a 1h/2h/3h minimum picker. Answers "when can I actually code?" |
| **Card → dialog morph** | Clicking a card runs a View Transition: the card's own pixels expand into the detail dialog. Switching days cross-dissolves the timeline through the same mechanism, scoped so the two never interfere. Browsers without the API get a CSS entrance instead. |
| **Keyboard layer** | `/` focuses search, `←`/`→` change day, `Esc` resets — ignored while typing in a field. |
| **★ My schedule** | Starred events persist in `localStorage`, giving a personal agenda with no login (auth was out of scope). |
| **Detail dialog** | Full description, clickable map coordinates, the official floor-map image, meal menus, sponsor, and an *Add to Google Calendar* link. |
| **Resilient data layer** | Skeletons, an error state with retry, silent refresh every 5 minutes, manual refresh with a "last updated" stamp. Background refreshes keep old data on screen instead of flashing a spinner. |
| **Accessibility** | Real buttons everywhere, `aria-pressed` toggles, `aria-live` counts, Escape-to-close and focus management in the dialog, visible focus rings, and a full `prefers-reduced-motion` path. |

## Project structure

```
src/
  api/events.ts          fetch + normalize the event service response
  hooks/
    useEvents.ts         loading/error/refresh state machine + polling
    useEventDialog.ts    dialog state + the card→dialog View Transition
    useFavorites.ts      starred events, persisted to localStorage
    useNow.ts            ticking clock that drives live badges
    useAmbient.ts        scroll/pointer values for the scene (rAF, no re-render)
    useReveal.ts         shared IntersectionObserver for scroll reveals
    useShortcuts.ts      keyboard layer
  lib/
    schedule.ts          days, filtering, slots, gaps, now-marker, counts (pure)
    time.ts              Central-Time formatting, status, countdowns (pure)
    eventMeta.ts         per-type label + icon
    viewTransition.ts    one guarded View Transition helper for both flows
  components/            Header, Rail, DayShape, EventCard, EventDetail,
                         Icon, Feedback, OceanBackground
  styles/                theme.css (tokens + ocean backdrop), app.css
  App.tsx                composes state → derived data → UI
```

## The look

Styled as a descent, not a list. No WebGL, no animation library, no image assets —
the entire visual system is ~6 kB gzipped of CSS.

- **Layered scene** (`OceanBackground`): water-column gradient, cursor-tracked dive
  light, soft-light **caustics** from an SVG `feTurbulence` texture, screen-blended
  **god rays**, a two-tier particle field (crisp near bubbles, blurred far marine snow —
  depth of field on the cheap), **vignette**, and an animated **film grain** overlay.
- **Scroll-driven grade**: `useAmbient` writes `--scroll` and `--pointer-x/y` to the
  root inside a `requestAnimationFrame`, so the water darkens with depth and the hero
  parallaxes — in CSS, with zero React re-renders per frame.
- **Custom icon set** (`Icon.tsx`), not emoji: emoji render differently on every OS,
  ignore `currentColor` and won't sit on a baseline. ~1 kB of inline SVG on a single
  stroke weight keeps the whole UI in one visual language.
- **Typography**: Instrument Serif for display and numerals, Inter for UI; one italic
  accent line instead of a gradient; tabular numerals everywhere a time appears so the
  timeline column doesn't shimmer as it updates.
- **Kinetic headline**: each word rises out of its own overflow mask on a stagger, with
  the glow layered *behind* the type (a drop-shadow would be clipped by the mask).
- **Reveal on scroll**: one shared `IntersectionObserver` (`useReveal`) fades, lifts and
  un-blurs rows with a per-index stagger, then unobserves them.
- **Cards as glass**: backdrop blur, a type-coloured accent rail, and a cursor-tracked
  glare plus 3° tilt written as CSS variables on pointer move — never through React state.
- **One easing curve** (`--ease`) and one reveal animation across the page, so the motion
  reads as authored rather than assembled.
- **Starring is a moment**: a ring bursts off the button when an event is added, and
  only then — the burst is tied to a transient id, so it never replays when a starred
  card re-mounts on a filter change.
- Under `prefers-reduced-motion` the grain and particles are removed, transitions are
  cut, the view transition is skipped, and revealed content is forced visible.

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

23 tests covering day bucketing (including the late-night timezone edge case), filter
combination logic, time-slot grouping, break-row thresholds, the now-marker's
"only if the reader is actually in this day" rule, hour-density bucketing, filter counts, live/upcoming
classification, duration + countdown formatting, and the API client's sorting,
normalization, fallback and error paths.

## Tech + sources

- React 19, TypeScript, Vite, Vitest
- Data: `GET https://adonix.hackillinois.org/event/` ([API docs](https://api.docs.hackillinois.org/))
- `Intl.DateTimeFormat` time-zone formatting — [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- View Transitions API for the card→dialog morph — [MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- Google Calendar template URL parameters — [documented format](https://developers.google.com/calendar)
- AI assistance (Claude) was used to speed up CSS scaffolding and boilerplate; all
  architecture, data modeling and logic decisions are my own and I'm happy to walk
  through any line of it.
