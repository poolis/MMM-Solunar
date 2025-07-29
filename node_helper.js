/* MagicMirror² Node Helper: MMM-Solunar
 * Handles backend tasks for the module
 */
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
    start: function() {
        console.log("MMM-Solunar node_helper started");
    },

    socketNotificationReceived: function(notification, payload) {
        // Handle socket notifications from the module
    }
});
