# CLAUDE.md — MMM-BOM-Forecast

MagicMirror² module showing a multi-day forecast for an Australian location from the Bureau
of Meteorology's statewide XML feed. Counterpart to MMM-BOM-Current. Original code, MIT
licensed. Full option reference in README.md.

## Layout

- `MMM-BOM-Forecast.js` — front-end module; picks the configured `location` out of the
  statewide XML, renders the table, and keeps a per-date temp cache in memory. Declares
  `forecast-cache.js` via `getScripts()`.
- `forecast-cache.js` — `mergeForecastTemps()`: BOM drops a day's min once the overnight low
  has passed and its max once the afternoon high has passed; this retains the last known
  value per date so "Today" doesn't lose its numbers mid-afternoon. `node forecast-cache.js`
  runs its built-in self-check.
- `temp-cache-store.js` — load/save of that cache to disk, used by the node helper.
- `node_helper.js` — fetches the feed (rewrites `http://` to `https://`; BOM publishes
  http URLs), rate-limits (5-minute floor, overridable via
  `BOM_FORECAST_MIN_FETCH_INTERVAL_MS` so the parent's e2e suite can test a second fetch),
  and persists the temp cache to `temp-cache.json` in this directory so it survives a
  `docker restart`. Sends `{ xml, tempCache }` to the front end; receives
  `BOM_FORECAST_TEMP_CACHE_SAVE` back after every render.

## Gotchas

- `temp-cache.json` is runtime state written into the module directory. It is gitignored
  here; keep it that way.
- The front end seeds its in-memory cache from the node helper's on-disk copy exactly once
  per session (`tempCacheSeeded`) — after that its own copy is authoritative. Don't "fix"
  that into re-seeding on every fetch; it would resurrect stale values.
- The `show()` call uses MagicMirror's three-argument signature
  (`speed, callback, options`); the two-argument form silently ignores `lockString`.

## How this repo is consumed

This module is a **git submodule** of [kmbrimble/magicmirror2](https://github.com/kmbrimble/magicmirror2)
(at `modules/MMM-BOM-Forecast`), which is the MagicMirror² instance behind the household kiosk's left pane.
That parent pins a specific commit of this repo; the wall display runs whatever the parent
points at, not this repo's `master`.

**A change here is not deployed until the parent's pointer is bumped.** The flow is:

1. Commit and push here (`master`).
2. In the magicmirror2 checkout: `git -C modules/MMM-BOM-Forecast pull origin master`, then
   `git add modules/MMM-BOM-Forecast` and commit ("Bump MMM-BOM-Forecast to <sha>: ...") and push.
3. Deploy per magicmirror2's CLAUDE.md: pull the live clone,
   `git submodule update --init --recursive`, `docker restart MagicMirror`.

Push this repo before pushing the parent bump — a parent pointing at a commit that isn't on
GitHub breaks every other clone.

## Testing

There is no unit test suite in this repo. The parent's Playwright e2e suite
(`test/e2e/run.sh` in magicmirror2) runs this module against fixture data at the kiosk's real
1720x1440 resolution with a screenshot baseline — run it from a magicmirror2 checkout whose
submodule is on your working commit before bumping the pointer. The physical kiosk display is
still the final visual check.

## Constraints

- Keep the module standalone-installable: no dependency on anything in the parent repo
  (config values come from `config.js` via the normal MagicMirror `config` object).
- Don't commit runtime or secret files; this repo's `.gitignore` is what protects them once
  it's a submodule — the parent's ignore rules do not reach inside.
