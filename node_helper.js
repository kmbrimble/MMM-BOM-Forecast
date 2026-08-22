var NodeHelper = require("node_helper");
const https = require('https');

module.exports = NodeHelper.create({

    socketNotificationReceived: function (notification, payload) {
        if (notification === 'LOAD_BOM_FORECAST') {
            // Force HTTPS if it was HTTP
            var securePayload = payload.replace("http://", "https://");
            this.getBomForecast(securePayload);
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
            
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                console.log('BomForecast', 'Data received. Length:', data.length);
                this.sendSocketNotification('LOAD_BOM_FORECAST_RECEIVED', data);
            });

        }).on('error', (error) => {
            console.log("Error: " + error.message);
        });
    },

});
