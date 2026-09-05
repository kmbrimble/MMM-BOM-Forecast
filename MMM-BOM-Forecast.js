//MMM-BOM-Forecast.js:

Module.register("MMM-BOM-Forecast",{
	// Default module config.
	defaults: {
		location: "Canberra",
		locationState: "ACT",
	        iconset: 'highcontrast',
		animationSpeed: 1000,
		appendLocationNameToHeader: true,
                iconTable: {
                        "1": "wi-day-sunny",
                        "2": "wi-forecast-io-clear-day",
                        "3": "wi-cloudy",
                        "4": "wi-cloudy",
                        "6": "wi-day-haze",
                        "8": "wi-day-rain",
                        "9": "wi-day-windy",
                        "10": "wi-day-fog",
                        "11": "wi-day-showers",
                        "12": "wi-day-rain",
                        "13": "wi-dust",
                        "14": "wi-day-sleet",
                        "15": "wi-day-snow",
                        "16": "wi-day-thunderstorm",
                        "17": "wi-day-showers",
                        "18": "wi-day-storm-showers",
                        "19": "wi-tornado"
                },
		tableClass: "small",
		calendarClass: "calendar",
		showRainChance: "true",
		showRainAmount: "true",
		colored: "true",
		units: "metric",
		updateInterval: 1000 * 60 * 60,

	},


        // Define required scripts.
        getScripts: function () {
                return ["moment.js", "forecast-cache.js"];
        },

        // Define required scripts.
        getStyles: function () {
                return ["weather-icons.css", "MMM-BOM-Forecast.css"];
        },

	start: function() {
		this.forecast = [];
		this.loaded = false;
		moment.locale(config.language);
		this.updateTimer = null;
		this.tempCache = {};

		if (this.config.decimalSymbol === "" || this.config.decimalSymbol === " ") {
			this.config.decimalSymbol = ".";
		}
		if (this.config.fadePoint < 0) {
			this.config.fadePoint = 0;
		}

		this.sendSocketNotification('LOAD_BOM_FORECAST', this.getUrl(this.config.locationState));
		setInterval(() => {
			this.sendSocketNotification('LOAD_BOM_FORECAST', this.getUrl(this.config.locationState));
		}, this.config.updateInterval);
	},
		
	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");
		if (this.config.location === "" ) {
                        wrapper.innerHTML = "Please set the correct location in the config for module: " + this.name + ".";
                        wrapper.className = "dimmed light small";
                        return wrapper;
                }

                if (!this.loaded) {
                        wrapper.innerHTML = "Loading...";
                        wrapper.className = "dimmed light small";
                        return wrapper;
                }

		var showRadar = 0;
                var table = document.createElement("table");
                table.className = this.config.tableClass;
                for (var f in this.forecast) {
                        var forecast = this.forecast[f];
                        var row = document.createElement("tr");
                        if (this.config.colored) {
                                row.className = "colored";
                        }
                        table.appendChild(row);

                        var dayCell = document.createElement("td");
                        dayCell.className = "day";
                        dayCell.innerHTML = forecast.day;
                        row.appendChild(dayCell);

                        var iconCell = document.createElement("td");
                        iconCell.className = "bright weather-icon";
                        row.appendChild(iconCell);

                        var icon = document.createElement("span");
                        icon.className = "wi weathericon " + this.config.iconTable[forecast.icon];
                        iconCell.appendChild(icon);

                        var degreeLabel = "";
                        if (this.config.units === "metric" || this.config.units === "imperial") {
                                degreeLabel += "°";
                        }
                        if (this.config.scale) {
                                switch (this.config.units) {
                                        case "metric":
                                                degreeLabel += "C";
                                                break;
                                        case "imperial":
                                                degreeLabel += "F";
                                                break;
                                        case "default":
                                                degreeLabel = "K";
                                                break;
                                }
                        }

                        // 1. Render Minimum Temperature First
                        var minTempCell = document.createElement("td");
                        minTempCell.innerHTML = forecast.minTemp.replace(".", this.config.decimalSymbol) + degreeLabel;
                        minTempCell.className = "align-right min-temp";
                        row.appendChild(minTempCell);

                        // 2. Render Maximum Temperature Second
                        var maxTempCell = document.createElement("td");
                        maxTempCell.innerHTML = forecast.maxTemp.replace(".", this.config.decimalSymbol) + degreeLabel;
                        maxTempCell.className = "align-right bright max-temp";
                        row.appendChild(maxTempCell);

			if (this.config.showRainChance) {
				var rainCCell = document.createElement("td");
				rainCCell.innerHTML = forecast.rainChance;
				rainCCell.className = "align-right bright rain";
				row.appendChild(rainCCell);
				if ((f == 0) && (forecast.rainChance != "0%")) {
				 showRadar = 1;
				}
			}

                        if (this.config.showRainAmount) {
                                var rainCell = document.createElement("td");
                                if (!forecast.rainAmount) {
                                        rainCell.innerHTML = "No rain";
                                } else {
	                                rainCell.innerHTML = forecast.rainAmount;
				}
                                rainCell.className = "align-right bright rain bom-smallrma";
                                row.appendChild(rainCell);
                        }
	
                        if (this.config.fade && this.config.fadePoint < 1) {
                                var startingPoint = this.forecast.length * this.config.fadePoint;
                                var steps = this.forecast.length - startingPoint;
                                if (f >= startingPoint) {
                                        var currentStep = f - startingPoint;
                                        row.style.opacity = 1 - (1 / steps) * currentStep;
                                }
                        }
                }

                if (this.config.radarImage && showRadar) {
                        var radarImg = document.createElement("img");
                        radarImg.setAttribute("src", this.config.radarImage);
                        radarImg.setAttribute("width", "340px");
                        var radarCell = document.createElement("td");
			radarCell.setAttribute("colspan", "42");
                        radarCell.appendChild(radarImg);
                        var radarRow = document.createElement("tr");
                        radarRow.appendChild(radarCell);
                        table.append(radarRow);

                }

                return table;

	},

        // Override getHeader method.
        getHeader: function () {
                if (this.config.appendLocationNameToHeader) {
                        if (this.data.header) return this.data.header + " " + this.fetchedLocationName;
                        else return this.fetchedLocationName;
                }

                return this.data.header ? this.data.header : "";
        },

        /* getUrl()
         * Looks up the BOM forecast feed URL for the configured locationState.
         *
         * return String - feed URL, or undefined if locationState is unrecognised.
         */
        getUrl: function () {

        switch (this.config.locationState) {
            case "ACT":
            case "NSW":
                return "http://www.bom.gov.au/fwo/IDN11060.xml";
            case "NT":
                return "http://www.bom.gov.au/fwo/IDD10207.xml";
            case "QLD":
                return "http://www.bom.gov.au/fwo/IDQ10095.xml";
            case "SA":
                return "http://www.bom.gov.au/fwo/IDS10044.xml";
            case "TAS":
                return "http://www.bom.gov.au/fwo/IDT16710.xml";
            case "VIC":
                return "http://www.bom.gov.au/fwo/IDV10753.xml";
            case "WA":
                return "http://www.bom.gov.au/fwo/IDW14199.xml";
            default:
                return undefined;
        }
        },

	parseXml: function(xmlStr) {
            return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
        },


        /* processWeather(data)
         * Uses the received data to set the various values.
         *
         * argument data object - Weather information received form openweather.org.
         */
        processWeather: function (data) {

        this.fetchedLocationName = this.config.location;
        this.forecast = [];
        var lastDay = null;
        var forecastData = {};
        // Seed this session's temp cache from node_helper's on-disk copy
        // exactly once -- afterwards this session's own cache is at least
        // as current (and gets reported back after every fetch), so a
        // later disk snapshot would only ever be stale by comparison.
        if (!this.tempCacheSeeded) {
            this.tempCache = Object.assign({}, data.tempCache, this.tempCache);
            this.tempCacheSeeded = true;
        }
        var xmlDoc = this.parseXml(data.xml);
        var areas = xmlDoc.getElementsByTagName('area');

        outer: for(var i=0; i<areas.length; i++){
		if (areas[i].attributes.description.value == this.config.location && areas[i].getAttribute('type') == "location") {
                fpdays = areas[i].getElementsByTagName('forecast-period');
                for (var fp=0; fp<fpdays.length; fp++) {
                    var day = 0;
                    var icon = 0;
                    var maxTemp = 0;
                    var minTemp = 0;
                    var rain = 0;
		    var rainChance = 0;

                    var dateKey = fpdays[fp].attributes.getNamedItem('start-time-local').value.slice(0, 10);
                    day = moment(fpdays[fp].attributes.getNamedItem('start-time-local').value, "YYYY-MM-DD hh:mm:ss").format("ddd");
                   // Rename current day (day 0) forecast to "Today"
                    if (day === moment().format("ddd")) {
                        day = "Today";
                    }

                    hour = moment(fpdays[fp].attributes.getNamedItem('start-time-local').value, "YYYY-MM-DD hh:mm:ss").format("H");
                    els = fpdays[fp].getElementsByTagName('element');

                    for (var e=0; e<els.length; e++) {
                        if (els[e].attributes.type.value == 'forecast_icon_code') {
                            icon = els[e].firstChild.data;
                        }
                        if (els[e].attributes.type.value == 'air_temperature_minimum') {
                            minTemp = els[e].firstChild.data;
                        }
                        if (els[e].attributes.type.value == 'air_temperature_maximum') {
                            maxTemp = els[e].firstChild.data;
                        }
                        if (els[e].attributes.type.value == 'precipitation_range') {
                            rain = els[e].firstChild.data;
                        }
                    }
                    els = fpdays[fp].getElementsByTagName('text');
                    for (var et=0; et<els.length; et++) {
                        if (els[et].attributes.type.value == 'probability_of_precipitation') {
                            rainChance = els[et].firstChild.data;
                        }
                    }
                    // BOM stops reporting a day's min once the overnight low has
                    // passed, and its max once the afternoon high has passed --
                    // retain the last known value for that date across refetches.
                    var mergedTemps = mergeForecastTemps(this.tempCache, dateKey, minTemp, maxTemp);

                    forecastData = {
                                            day: day,
                                            icon: icon,
                                            maxTemp: mergedTemps.maxTemp?mergedTemps.maxTemp:"-",
                                            minTemp: mergedTemps.minTemp?mergedTemps.minTemp:"-",
                                            rainAmount: rain,
			    		    rainChance: rainChance
                                    };
                    this.forecast.push(forecastData);

                    // Stop processing when maxNumberOfDays is reached
                    if (this.forecast.length === this.config.maxNumberOfDays) {
                        break;
                    }
                }
		break outer;
            }
        }

                this.show(this.config.animationSpeed, undefined, { lockString: this.identifier });
                this.loaded = true;
                this.updateDom(this.config.animationSpeed);
                this.sendSocketNotification('BOM_FORECAST_TEMP_CACHE_SAVE', this.tempCache);
        },


	socketNotificationReceived: function(notification, payload) {
		if (notification === 'LOAD_BOM_FORECAST_RECEIVED') {
			this.processWeather(payload);
			this.updateDom();
		}
	}

});
