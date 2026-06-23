/* MagicMirror² Node Helper: MMM-Solunar
 * Handles backend tasks for the module
 */
const NodeHelper = require("node_helper");

function toDateString(date) {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function toIsoDateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeOffset(tz) {
    if (typeof tz === "number" && Number.isFinite(tz)) {
        const sign = tz >= 0 ? "+" : "-";
        const hours = String(Math.abs(Math.trunc(tz))).padStart(2, "0");
        return `${sign}${hours}:00`;
    }

    if (typeof tz === "string") {
        const trimmed = tz.trim();
        if (/^[+-]\d{1,2}$/.test(trimmed)) {
            const n = parseInt(trimmed, 10);
            const sign = n >= 0 ? "+" : "-";
            return `${sign}${String(Math.abs(n)).padStart(2, "0")}:00`;
        }
        if (/^[+-]\d{1,2}:\d{2}$/.test(trimmed)) {
            const [h, m] = trimmed.split(":");
            const sign = h.startsWith("-") ? "-" : "+";
            const hourDigits = h.replace(/[+-]/, "");
            return `${sign}${hourDigits.padStart(2, "0")}:${m}`;
        }
    }

    return "+00:00";
}

function extractHHMM(isoTime) {
    if (!isoTime || typeof isoTime !== "string") {
        return null;
    }

    const match = isoTime.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : null;
}

function shiftHHMM(time, minutesDelta) {
    if (!time || typeof time !== "string") {
        return null;
    }

    const [h, m] = time.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) {
        return null;
    }

    let total = h * 60 + m + minutesDelta;
    total = ((total % 1440) + 1440) % 1440;
    const outH = String(Math.floor(total / 60)).padStart(2, "0");
    const outM = String(total % 60).padStart(2, "0");
    return `${outH}:${outM}`;
}

function moonPhaseNameFromDegrees(degrees) {
    if (!Number.isFinite(degrees)) {
        return null;
    }

    const normalized = ((degrees % 360) + 360) % 360;
    if (normalized < 22.5 || normalized >= 337.5) return "New Moon";
    if (normalized < 67.5) return "Waxing Crescent";
    if (normalized < 112.5) return "First Quarter";
    if (normalized < 157.5) return "Waxing Gibbous";
    if (normalized < 202.5) return "Full Moon";
    if (normalized < 247.5) return "Waning Gibbous";
    if (normalized < 292.5) return "Last Quarter";
    return "Waning Crescent";
}

function dayRatingFromPhaseDegrees(degrees) {
    if (!Number.isFinite(degrees)) {
        return 0;
    }

    const normalized = ((degrees % 360) + 360) % 360;
    const distanceToNew = Math.min(normalized, 360 - normalized);
    const distanceToFull = Math.abs(normalized - 180);
    const distance = Math.min(distanceToNew, distanceToFull);

    if (distance <= 8) return 5;
    if (distance <= 20) return 4;
    if (distance <= 35) return 3;
    if (distance <= 55) return 2;
    if (distance <= 75) return 1;
    return 0;
}

function mapMetNoToSolunar(data) {
    const props = data && data.properties ? data.properties : {};
    const moonrise = extractHHMM(props.moonrise && props.moonrise.time);
    const moonset = extractHHMM(props.moonset && props.moonset.time);
    const highMoon = extractHHMM(props.high_moon && props.high_moon.time);
    const lowMoon = extractHHMM(props.low_moon && props.low_moon.time);
    const moonPhaseDegrees = Number(props.moonphase);

    return {
        moonPhase: moonPhaseNameFromDegrees(moonPhaseDegrees),
        dayRating: dayRatingFromPhaseDegrees(moonPhaseDegrees),
        major1Start: shiftHHMM(highMoon, -60),
        major1Stop: shiftHHMM(highMoon, 60),
        major2Start: shiftHHMM(lowMoon, -60),
        major2Stop: shiftHHMM(lowMoon, 60),
        minor1Start: shiftHHMM(moonrise, -60),
        minor1Stop: shiftHHMM(moonrise, 60),
        minor2Start: shiftHHMM(moonset, -60),
        minor2Stop: shiftHHMM(moonset, 60)
    };
}

module.exports = NodeHelper.create({
    start: function() {
        console.log("MMM-Solunar node_helper started");
    },

    fetchSolunarOrg: function(lat, lon, tz) {
        const now = new Date();
        const dateStr = toDateString(now);
        const url = `https://api.solunar.org/solunar/${lat},${lon},${dateStr},${tz}`;

        return fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`solunar.org returned ${response.status}`);
                }
                return response.json();
            });
    },

    fetchMetNo: function(lat, lon, tz) {
        const now = new Date();
        const date = toIsoDateString(now);
        const offset = normalizeOffset(tz);
        const url = `https://api.met.no/weatherapi/sunrise/3.0/moon?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&date=${encodeURIComponent(date)}&offset=${encodeURIComponent(offset)}`;

        return fetch(url, {
            headers: {
                "User-Agent": "MMM-Solunar/1.0 (https://github.com/poolis/MMM-Solunar)"
            }
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`api.met.no returned ${response.status}`);
                }
                return response.json();
            })
            .then(mapMetNoToSolunar);
    },

    fetchByProvider: function(provider, lat, lon, tz) {
        if (provider === "solunarOrg") {
            return this.fetchSolunarOrg(lat, lon, tz);
        }
        if (provider === "metNo") {
            return this.fetchMetNo(lat, lon, tz);
        }
        return Promise.reject(new Error(`Unsupported apiProvider: ${provider}`));
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "GET_SOLUNAR_DATA") {
            const lat = payload.latitude;
            const lon = payload.longitude;
            const tz = payload.tz;
            const provider = payload.apiProvider || "auto";

            let request;
            if (provider === "auto") {
                request = this.fetchByProvider("metNo", lat, lon, tz)
                    .catch(() => this.fetchByProvider("solunarOrg", lat, lon, tz));
            } else {
                request = this.fetchByProvider(provider, lat, lon, tz);
            }

            request
                .then((data) => {
                    this.sendSocketNotification("SOLUNAR_DATA", data);
                })
                .catch(() => {
                    this.sendSocketNotification("SOLUNAR_DATA", { error: "Failed to fetch solunar data." });
                });
        }
    }
});
