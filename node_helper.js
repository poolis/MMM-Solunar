/* MagicMirror² Node Helper: MMM-Solunar
 * Handles backend tasks for the module
 */
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
    start: function() {
        console.log("MMM-Solunar node_helper started");
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "GET_SOLUNAR_DATA") {
            const now = new Date();
            const lat = payload.latitude;
            const lon = payload.longitude;
            const tz = payload.tz;
            const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
            const url = `https://api.solunar.org/solunar/${lat},${lon},${dateStr},${tz}`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    this.sendSocketNotification("SOLUNAR_DATA", data);
                })
                .catch(error => {
                    this.sendSocketNotification("SOLUNAR_DATA", { error: 'Failed to fetch solunar data.' });
                });
        }
    }
});
