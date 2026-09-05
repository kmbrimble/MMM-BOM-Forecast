var NodeHelper = require("node_helper");
const https = require('https');
const fs = require('fs');
const path = require('path');
const tempCacheStore = require('./temp-cache-store');

// floor beneath any configured updateInterval; overridable for e2e so the
// suite can exercise a real second fetch without a 5-minute wait
const MIN_FETCH_INTERVAL_MS = process.env.BOM_FORECAST_MIN_FETCH_INTERVAL_MS
    ? parseInt(process.env.BOM_FORECAST_MIN_FETCH_INTERVAL_MS, 10)
    : 5 * 60 * 1000;

module.exports = NodeHelper.create({

    start: function () {
        this.lastFetchTime = 0;
        this.lastData = null;
        // Lives under the module's own directory, a real host bind mount
        // in production, so it survives a `docker restart` -- protects
        // today's already-fetched low/high from a restart that lands
        // after BOM has stopped reporting them for the day.
        this.tempCacheFile = path.join(this.path, 'temp-cache.json');
        this.tempCache = tempCacheStore.loadCache(fs, this.tempCacheFile);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === 'LOAD_BOM_FORECAST') {
            const now = Date.now();
            if (now - this.lastFetchTime < MIN_FETCH_INTERVAL_MS) {
                console.log("MMM-BOM-Forecast: Below minimum interval of " + MIN_FETCH_INTERVAL_MS + "ms, serving cached data instead of re-fetching.");
                if (this.lastData) {
                    this.sendSocketNotification('LOAD_BOM_FORECAST_RECEIVED', { xml: this.lastData, tempCache: this.tempCache });
                }
                return;
            }
            // Force HTTPS if it was HTTP
            var url = new URL(payload);
            url.protocol = "https:";
            this.getBomForecast(url.toString());
        } else if (notification === 'BOM_FORECAST_TEMP_CACHE_SAVE') {
            Object.assign(this.tempCache, payload);
            tempCacheStore.saveCache(fs, this.tempCacheFile, this.tempCache);
        }
    },

    getBomForecast: function (payload) {
        console.log("Fetch URL: " + payload);
        const options = {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "*/*",
                "Cache-Control": "no-cache"
            }
        };

        https.get(payload, options, (response) => {
            console.log("BOM Response Status:", response.statusCode);

            if (response.statusCode !== 200) {
                console.log("MMM-BOM-Forecast: Failed to connect. Status: " + response.statusCode);
                response.resume();
                return;
            }

            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                console.log('BomForecast', 'Data received. Length:', data.length);
                this.lastFetchTime = Date.now();
                this.lastData = data;
                this.sendSocketNotification('LOAD_BOM_FORECAST_RECEIVED', { xml: data, tempCache: this.tempCache });
            });

        }).on('error', (error) => {
            console.log("Error: " + error.message);
        });
    },

});
