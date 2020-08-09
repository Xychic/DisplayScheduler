/* global Module */

/* Magic Mirror
* Module: MMM-DisplayScheduler
*
* By Jacob Turner: https://github.com/Xychic/DisplayScheduler
* MIT Licensed.
*/

Module.register("MMM-DisplayScheduler", {
	defaults: {
		text: "Hello, World!",
		debug: false,
		display_schedule: false,
		relay_pin: 22,
	},
	start: function() {
        Log.info("Starting module: " + this.name);
		this.sendSocketNotification("INITIALISE_SCHEDULER", this.config);
    },

  	getDom: function() {
		var element = document.createElement("div")
		element.className = "myContent"
		element.innerHTML = this.config.text
		return element
  	},

  	notificationReceived: function(notification, payload, sender) {
		var self = this;
		if (sender === undefined && notification === "ALL_MODULES_STARTED") {
			if (this.config.display_schedule) {
				this.sendSocketNotification("CREATE_DISPLAY_SCHEDULE", this.config.display_schedule);
			}
			return;
		}
	},

	socketNotificationReceived: function(notification, payload) {
		console.log("Notification: " + notification + " Payload: " + payload);
		if (notification === "SHOW" || notification === "HIDE") {
			this.sendSocketNotification(notification, payload)
		}
		return;
	},
});