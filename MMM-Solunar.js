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
        this.getData();
        var self = this;
        setInterval(function() {
            self.getData();
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

    getDom: function() {
        var wrapper = document.createElement("div");
        wrapper.style.textAlign = "center";
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
        if (this.solunarData && typeof this.solunarData.dayRating !== 'undefined') {
            const DAY_RATING_MAP = {
                0: "Avg",
                1: "Avg+",
                2: "Good",
                3: "Better",
                4: "Best",
                5: "Season's Best"
            };
            dayRatingStr = DAY_RATING_MAP[this.solunarData.dayRating] || '';
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
        // Align the ranges in a table
        if (majorRanges.length > 0 || minorRanges.length > 0) {
            let table = `<table style='width:100%;text-align:center;'>`;
            table += `<tr><th style='text-align:center;'>Major</th><th style='text-align:center;'>Minor</th></tr>`;
            for (let i = 0; i < Math.max(majorRanges.length, minorRanges.length); i++) {
                table += `<tr>`;
                table += `<td style='font-size:1.5em;white-space:nowrap;'>${majorRanges[i] || ''}</td>`;
                table += `<td style='font-size:1.5em;white-space:nowrap;'>${minorRanges[i] || ''}</td>`;
                table += `</tr>`;
            }
            table += `</table>`;
            wrapper.innerHTML =
                (moonEmoji ? `<strong>Moon phase:</strong> <span style='font-size:2em;'>${moonEmoji}</span><br>` : "") +
                (dayRatingStr ? `<strong>Day Rating:</strong> ${dayRatingStr}<br>` : "") +
                table;
            return wrapper;
        }
        wrapper.innerHTML = "Solunar data will appear here.";
        return wrapper;
    },

    getData: function() {
        // Fetch solunar data for the current day using the solunar.org API
        const now = new Date();
        const lat = this.config.latitude;
        const lon = this.config.longitude;
        const tz = this.config.tz;
        const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
        const url = `https://api.solunar.org/solunar/${lat},${lon},${dateStr},${tz}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                this.solunarData = data;
                this.loaded = true;
                this.updateDom();
            })
            .catch(error => {
                this.loaded = true;
                this.solunarData = { error: 'Failed to fetch solunar data.' };
                this.updateDom();
            });
    },

    notificationReceived: function(notification, payload, sender) {
        // Handle notifications if needed
    },

    socketNotificationReceived: function(notification, payload) {
        // Handle socket notifications from node_helper
    }
});
