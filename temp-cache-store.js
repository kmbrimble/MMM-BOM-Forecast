/* MMM-BOM-Forecast: reads/writes the forecast temp cache to disk so it
 * survives a container restart -- forecast-cache.js's in-memory merge
 * alone only protects a running session; the frontend module that holds
 * it runs in the browser and can't touch the filesystem itself, so
 * node_helper.js (server-side) persists it here on its behalf.
 */

(function (root) {
    function loadCache(fs, filePath) {
        try {
            return JSON.parse(fs.readFileSync(filePath, "utf8"));
        } catch (e) {
            return {};
        }
    }

    function saveCache(fs, filePath, cache) {
        fs.writeFileSync(filePath, JSON.stringify(cache));
    }

    var api = { loadCache: loadCache, saveCache: saveCache };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    } else {
        root.tempCacheStore = api;
    }
})(typeof window !== "undefined" ? window : this);

// Self-check: `node modules/MMM-BOM-Forecast/temp-cache-store.js`
if (typeof require !== "undefined" && require.main === module) {
    var assert = require("assert");
    var fs = require("fs");
    var os = require("os");
    var path = require("path");
    var store = module.exports;

    var tmpFile = path.join(os.tmpdir(), "bom-forecast-temp-cache-selfcheck.json");
    try {
        fs.unlinkSync(tmpFile);
    } catch (e) {}

    // No file on disk yet (first ever run) -- empty cache, no throw.
    assert.deepStrictEqual(store.loadCache(fs, tmpFile), {});

    // Round-trips what was saved.
    var cache = { "2026-08-24": { minTemp: "9.5", maxTemp: "22.0" } };
    store.saveCache(fs, tmpFile, cache);
    assert.deepStrictEqual(store.loadCache(fs, tmpFile), cache);

    // Corrupted file -- empty cache, no throw (never crash node_helper
    // startup over a bad cache file).
    fs.writeFileSync(tmpFile, "not json");
    assert.deepStrictEqual(store.loadCache(fs, tmpFile), {});

    fs.unlinkSync(tmpFile);
    console.log("temp-cache-store.js self-check passed");
}
