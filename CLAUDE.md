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

## Forge (changed 2 Nov 2026)

**Gitea is primary; GitHub is a read-only push mirror and must never be pushed to directly** (the mirror force-syncs and prunes refs; Gitea syncs on every push and every 10 minutes).
Work on `https://git.kiztigs.com/kmbrimble/MMM-BOM-Forecast` (`origin`, gt credential helper); use `gt`, not `gh`, for issues and PRs. `master` is protected: PR + the green `CI / check (pull_request)` check
(`.gitea/workflows/ci.yml`); butler-bot merges its own green PRs. GitHub has Issues, Wiki, Projects, Discussions and PRs switched off. The reason this repo stays public on GitHub is that magicmirror2
consumes it as a submodule through its GitHub URL (see below), and so that others can clone the module.

## How this repo is consumed

This module is a **git submodule** of [kmbrimble/magicmirror2](https://git.kiztigs.com/kmbrimble/magicmirror2)
(at `modules/MMM-BOM-Forecast`), which is the MagicMirror² instance behind the household kiosk's left pane.
That parent pins a specific commit of this repo; the wall display runs whatever the parent
points at, not this repo's `master`.

**A change here is not deployed until the parent's pointer is bumped.** The flow is:

1. Change it on a branch here, push the branch **to Gitea**, open a PR (`gt pr create`); butler-bot merges it when the required `CI / check (pull_request)` is green. (Direct pushes to `master` are rejected.)
2. **Wait for the mirror to deliver the merge commit to GitHub**: `git ls-remote https://github.com/kmbrimble/MMM-BOM-Forecast.git refs/heads/master` must equal Gitea's (seconds, at most 10 minutes). magicmirror2's `.gitmodules`
   URL, and therefore the live host checkout's `git submodule update`, fetch this module from **GitHub**, so a commit that is not mirrored yet cannot be deployed.
3. In the magicmirror2 checkout: `git -C modules/MMM-BOM-Forecast fetch origin && git -C modules/MMM-BOM-Forecast checkout <sha>`, then
   `git add modules/MMM-BOM-Forecast` and commit ("Bump MMM-BOM-Forecast to <sha>: ...") via a magicmirror2 PR.
4. Deploy per magicmirror2's CLAUDE.md: pull the live clone,
   `git submodule update --init --recursive`, `docker restart MagicMirror`.

Merge this repo (and let it mirror) before merging the parent bump — a parent pointing at a commit that isn't on
GitHub yet breaks the live host checkout and every other clone.

## Testing

Gitea CI (`.gitea/workflows/ci.yml`) is the required gate: syntax check of every JS file, the module's own self-checks, and a load of `node_helper.js` against a stubbed MagicMirror. There is no unit test suite beyond that. The parent's Playwright e2e suite
(`test/e2e/run.sh` in magicmirror2) runs this module against fixture data at the kiosk's real
1720x1440 resolution with a screenshot baseline — run it from a magicmirror2 checkout whose
submodule is on your working commit before bumping the pointer. The physical kiosk display is
still the final visual check.

## Constraints

- Keep the module standalone-installable: no dependency on anything in the parent repo
  (config values come from `config.js` via the normal MagicMirror `config` object).
- Don't commit runtime or secret files; this repo's `.gitignore` is what protects them once
  it's a submodule — the parent's ignore rules do not reach inside.
