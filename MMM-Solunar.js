/* MagicMirror² Module: MMM-Solunar
 * Solunar calendar module skeleton
 */
Module.register("MMM-Solunar", {
    // Default module config.
    defaults: {
        updateInterval: 60 * 60 * 1000, // 1 hour
        latitude: 40.7128, // Default: New York City
        longitude: -74.0060,// Default: New York City
        tz: -4 // Default: Eastern Daylight Time (EDT)
    },

    start: function() {
        this.loaded = false;
        this.sendSocketNotification("GET_SOLUNAR_DATA", {
            latitude: this.config.latitude,
            longitude: this.config.longitude,
            tz: this.config.tz
        });
        var self = this;
        setInterval(function() {
            self.sendSocketNotification("GET_SOLUNAR_DATA", {
                latitude: self.config.latitude,
                longitude: self.config.longitude,
                tz: self.config.tz
            });
        }, this.config.updateInterval);
    },

    getStyles: function() {
        return ["MMM-Solunar.css"];
    },

    // Helper to convert 24hr time (e.g., '13:45') to 12hr AM/PM
    toAmPm: function(timeStr) {
        if (!timeStr) return '';
        const [hourStr, minStr] = timeStr.split(":");
        let hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12;
        if (hour === 0) hour = 12;
        return `${hour}:${minStr} ${ampm}`;
    },

    getDayRatingInfo: function(dayRating) {
        const DAY_RATING_MAP = {
            0: ["Avg", "solunar-ok"],
            1: ["Avg+", "solunar-ok"],
            2: ["Good", "solunar-good"],
            3: ["Better", "solunar-good"],
            4: ["Best", "solunar-great"],
            5: ["Season's Best", "solunar-great"]
        };
        return DAY_RATING_MAP[dayRating] || ["", ""];
    },

    getDom: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "solunar-wrapper";
        if (!this.loaded) {
            wrapper.innerHTML = "Loading solunar data...";
            return wrapper;
        }
        if (this.solunarData && this.solunarData.error) {
            wrapper.innerHTML = this.solunarData.error;
            return wrapper;
        }
        let moonEmoji = '';
        if (this.solunarData && typeof this.solunarData.moonPhase === 'string') {
            const phase = this.solunarData.moonPhase.toLowerCase();
            if (phase.includes('new')) moonEmoji = '🌑';
            else if (phase.includes('waxing crescent')) moonEmoji = '🌒';
            else if (phase.includes('first quarter')) moonEmoji = '🌓';
            else if (phase.includes('waxing gibbous')) moonEmoji = '🌔';
            else if (phase.includes('full')) moonEmoji = '🌕';
            else if (phase.includes('waning gibbous')) moonEmoji = '🌖';
            else if (phase.includes('last quarter')) moonEmoji = '🌗';
            else if (phase.includes('waning crescent')) moonEmoji = '🌘';
        }
        let dayRatingStr = '';
        let dayRatingClass = '';
        if (this.solunarData && typeof this.solunarData.dayRating !== 'undefined') {
            [dayRatingStr, dayRatingClass] = this.getDayRatingInfo(this.solunarData.dayRating);
        }
        // Build major/minor time ranges
        let majorRanges = [];
        if (this.solunarData.major1Start && this.solunarData.major1Stop) {
            majorRanges.push(`${this.toAmPm(this.solunarData.major1Start)} - ${this.toAmPm(this.solunarData.major1Stop)}`);
        }
        if (this.solunarData.major2Start && this.solunarData.major2Stop) {
            majorRanges.push(`${this.toAmPm(this.solunarData.major2Start)} - ${this.toAmPm(this.solunarData.major2Stop)}`);
        }
        let minorRanges = [];
        if (this.solunarData.minor1Start && this.solunarData.minor1Stop) {
            minorRanges.push(`${this.toAmPm(this.solunarData.minor1Start)} - ${this.toAmPm(this.solunarData.minor1Stop)}`);
        }
        if (this.solunarData.minor2Start && this.solunarData.minor2Stop) {
            minorRanges.push(`${this.toAmPm(this.solunarData.minor2Start)} - ${this.toAmPm(this.solunarData.minor2Stop)}`);
        }
        // Show Major and Minor tables stacked vertically
        let majorTable = "";
        if (majorRanges.length > 0) {
            majorTable = `<table class='solunar-table'><tr><th>Major Times</th></tr>`;
            for (let i = 0; i < majorRanges.length; i++) {
                majorTable += `<tr><td class='solunar-major'>${majorRanges[i]}</td></tr>`;
            }
            majorTable += `</table>`;
        }
        let minorTable = "";
        if (minorRanges.length > 0) {
            minorTable = `<table class='solunar-table'><tr><th>Minor Times</th></tr>`;
            for (let i = 0; i < minorRanges.length; i++) {
                minorTable += `<tr><td class='solunar-minor'>${minorRanges[i]}</td></tr>`;
            }
            minorTable += `</table>`;
        }
        if (majorTable || minorTable) {
            wrapper.innerHTML =
                `<table class='solunar-table'><tr>` +
                (moonEmoji ? `<td>Moon phase: <span class='solunar-moon'>${moonEmoji}</span></td>` : "<td></td>") +
                (dayRatingStr ? `<td>Day rating: <span class='${dayRatingClass}'><strong>${dayRatingStr}</strong></span></td>` : "<td></td>") +
                `</tr></table>` +
                majorTable + minorTable;
            return wrapper;
        }
        wrapper.innerHTML = "Solunar data will appear here.";
        return wrapper;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "SOLUNAR_DATA") {
            this.solunarData = payload;
            this.loaded = true;
            this.updateDom();
        }
    }
});
