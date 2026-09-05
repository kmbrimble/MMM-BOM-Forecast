/* MMM-BOM-Forecast: retains a day's forecast min/max temp across refetches.
 *
 * BOM's XML forecast feed stops reporting a day's minimum temperature once
 * the overnight low has occurred, and stops reporting the maximum once the
 * afternoon high has occurred -- for "today" specifically, this means the
 * value that already rendered disappears from later hourly refetches even
 * though it's still the correct forecast for the day. Cache the last known
 * good value per calendar date and fall back to it when a fresh fetch comes
 * back empty for that date.
 */

(function (root) {
    // BOM's feed doesn't always omit a dropped value -- it sometimes sends
    // the literal string "-" in its place, which is truthy and would
    // otherwise be accepted as real data.
    function isMissing(value) {
        return !value || value === "-";
    }

    function mergeForecastTemps(cache, dateKey, minTemp, maxTemp) {
        var cached = cache[dateKey] || {};
        var merged = {
            minTemp: isMissing(minTemp) ? cached.minTemp : minTemp,
            maxTemp: isMissing(maxTemp) ? cached.maxTemp : maxTemp
        };
        cache[dateKey] = merged;
        return merged;
    }

    if (typeof module !== "undefined" && module.exports) {
        module.exports = mergeForecastTemps;
    } else {
        root.mergeForecastTemps = mergeForecastTemps;
    }
})(typeof window !== "undefined" ? window : this);

// Self-check: `node modules/MMM-BOM-Forecast/forecast-cache.js`
if (typeof require !== "undefined" && require.main === module) {
    var assert = require("assert");
    var mergeForecastTemps = module.exports;

    var cache = {};

    // First fetch of the day: both values present.
    var first = mergeForecastTemps(cache, "2026-08-22", "9.5", "22.0");
    assert.strictEqual(first.minTemp, "9.5");
    assert.strictEqual(first.maxTemp, "22.0");

    // Afternoon refetch: BOM drops the max as it's still pending, and now
    // also drops the min since the overnight low already happened -- wait,
    // more precisely: min disappears once morning passes, max disappears
    // once afternoon passes. Simulate min already gone (period passed).
    var afternoon = mergeForecastTemps(cache, "2026-08-22", 0, "23.5");
    assert.strictEqual(afternoon.minTemp, "9.5", "min should be retained from cache");
    assert.strictEqual(afternoon.maxTemp, "23.5", "max should update to fresh value");

    // Evening refetch: both now gone from the feed -- both should persist.
    var evening = mergeForecastTemps(cache, "2026-08-22", 0, 0);
    assert.strictEqual(evening.minTemp, "9.5", "min should still be retained");
    assert.strictEqual(evening.maxTemp, "23.5", "max should still be retained");

    // A new day starts fresh -- no bleed-over from the previous date's cache.
    var nextDay = mergeForecastTemps(cache, "2026-08-23", 0, 0);
    assert.strictEqual(nextDay.minTemp, undefined, "next day should not inherit previous day's values");
    assert.strictEqual(nextDay.maxTemp, undefined, "next day should not inherit previous day's values");

    // BOM's real feed sends the literal string "-" for a dropped value,
    // not an empty/missing element -- a truthy value that must still be
    // treated as missing, or it gets cached and rendered as-is.
    var dashAfterReal = mergeForecastTemps(cache, "2026-08-24", "-", "22.0");
    assert.strictEqual(dashAfterReal.minTemp, undefined, "\"-\" on first sighting should not be treated as a real value");
    var seeded = mergeForecastTemps(cache, "2026-08-24", "9.5", "22.0");
    assert.strictEqual(seeded.minTemp, "9.5");
    var dashAfterCached = mergeForecastTemps(cache, "2026-08-24", "-", "23.5");
    assert.strictEqual(dashAfterCached.minTemp, "9.5", "\"-\" must not overwrite a cached real value");
    assert.strictEqual(dashAfterCached.maxTemp, "23.5");

    console.log("forecast-cache.js self-check passed");
}
