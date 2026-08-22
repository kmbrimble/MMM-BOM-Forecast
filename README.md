# MMM-BOM-Forecast

A [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror) module that displays a
multi-day weather forecast for an Australian location, sourced directly from the Bureau of
Meteorology's (BOM) public XML forecast feed.

This is the forecast counterpart to
[MMM-BOM-Current](https://github.com/kmbrimble/MMM-BOM-Current), which shows live current
conditions from a different BOM feed (JSON observations). Run both side by side — one for
"now", one for "the next few days" — the same way MagicMirror's built-in `weather` module is
often run twice (`type: "current"` and `type: "forecast"`).

## Installation

1. Navigate to your MagicMirror's `modules` folder:
   ```
   cd ~/MagicMirror/modules
   ```
2. Clone this repository:
   ```
   git clone https://github.com/kmbrimble/MMM-BOM-Forecast.git
   ```

No `npm install` is required — the module has no external dependencies.

## Configuration

Add the module to the `modules` array in `config/config.js`:

```js
{
  module: "MMM-BOM-Forecast",
  position: "fullscreen_above",
  header: "Forecast",
  config: {
    location: "Brisbane",
    locationState: "QLD",
    showRainChance: true,
    showRainAmount: true,
    maxNumberOfDays: 7,
    colored: true
  }
}
```

### Options

| Option              | Details |
|----------------------|---------|
| `location`           | *Required* — the location name exactly as it appears in BOM's forecast XML for your state (e.g. `"Brisbane"`). |
| `locationState`      | *Required* — Australian state/territory abbreviation: `ACT`, `NSW`, `NT`, `QLD`, `SA`, `TAS`, `VIC`, `WA`. Selects which statewide BOM feed to fetch. |
| `maxNumberOfDays`     | *Optional* — how many forecast days to render. Default: all days returned by BOM (usually 7). |
| `showRainChance`      | *Optional* — show probability of precipitation. Default: `true`. |
| `showRainAmount`      | *Optional* — show forecast rainfall range. Default: `true`. |
| `colored`             | *Optional* — color min/max temperature cells. Default: `true`. |
| `appendLocationNameToHeader` | *Optional* — append the location name to the module header. Default: `true`. |
| `radarImage`          | *Optional* — a radar image URL to render below the table when today's rain chance is non-zero. |
| `iconset`             | *Optional* — cosmetic only currently; reserved for future icon theming. Default: `"highcontrast"`. |

### Finding your `location` value

BOM's statewide forecast XML groups forecasts by named location (e.g. `"Brisbane"`,
`"Sydney"`). The easiest way to find the exact name to use is to open your state's feed URL in
a browser (e.g. `http://www.bom.gov.au/fwo/IDQ10095.xml` for QLD) and search for an
`<area type="location" description="...">` entry matching your town or city.

## Notes

- Fetches with a browser-like `User-Agent` header, since BOM's server can otherwise reject
  requests from non-browser clients.
- The node helper rewrites `http://` feed URLs to `https://` before fetching.
- Polls once per hour — BOM's forecast data doesn't update more often than that.

## Provenance

Originally developed as `bomweather` alongside [MMM-BOM-Current](https://github.com/kmbrimble/MMM-BOM-Current)
to fill a gap the standard MagicMirror `weather` module doesn't cover — a native Australian BOM
data source. Renamed to `MMM-BOM-Forecast` for consistency with standard MagicMirror module
naming and to make its relationship to `MMM-BOM-Current` obvious at a glance.

## License

MIT — see [LICENSE](LICENSE).
