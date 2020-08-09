/* Magic Mirror
* Module: MMM-DisplayScheduler
*
* By Jacob Turner: https://github.com/Xychic/DisplayScheduler
* MIT Licensed.
*/
var NodeHelper = require("node_helper");
var CronJob = require("cron").CronJob;
var exec = require('child_process').exec;
var Gpio = require('onoff').Gpio;


const JOB_ACTION_SHOW = "show";
const JOB_ACTION_HIDE = "hide";


module.exports = NodeHelper.create({
    scheduledJobs: [],

    start: function() {
        console.log("Starting node helper for: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        this.log(this.name + " received " + notification);

        if (notification === "INITIALISE_SCHEDULER") {
            this.config = payload;
            this.log(this.name + " is setting the config");
            this.removeScheduledJobs();
            return true;
        } else if (notification == "CREATE_DISPLAY_SCHEDULE") {
            this.log(this.name + " is creating the display schedule");
            this.log(this.name + " recieved schedule: " + payload);
            this.createDisplaySchedule(payload);
            return true;
        } else if (notification == "SHOW") {
            return true;
        } else if (notification == "HIDE") {
            return true;
        }
    },

    createDisplaySchedule: function(display_schedule) {
        var display_schedules = this.getOrMakeArray(display_schedule);
        for (var i = 0; i < display_schedules.length; i++) {
            var displaySchedule = display_schedules[i];
            var showJob = this.createCronJob(displaySchedule.from, JOB_ACTION_SHOW);

            if (!showJob) {
                break;
            }

            var hideJob = this.createCronJob(displaySchedule.to, JOB_ACTION_HIDE);

            if (!hideJob) {
                showJob.stop();
                break;
            }
            this.scheduledJobs.push({showJob, hideJob});

        }
        return;
    },

    removeScheduledJobs: function() {
        this.log(this.name + " is removing all scheduled jobs");
        for (var i = 0; i < this.scheduledJobs.length; i++) {
            var scheduledJob = this.scheduledJobs[i];
            if( typeof scheduledJob.showJob === "object") {
                this.stopCronJob(scheduledJob.showJob);
            }
            if( typeof scheduledJob.hideJob === "object") {
                this.stopCronJob(scheduledJob.hideJob);
            }
        }
        this.scheduledJobs.length = 0;
    },

    /**
     * Returns a CronJob object that has been scheduled to trigger the
     * specified action based on the supplied cronTime and options
     *
     * @param  cronTime a cron expression which determines when the job will fire
     * @param  action   the action which should be performed (either show, hide, dim or send)
     * @return      the scheduled cron job
     * @see         CronJob
     */
    createCronJob: function(cronTime, action) {
        var self = this;

        // Validate Action
        if (!this.isValidAction(action)) { return false; }

        // Build notification
        var notification = action.toUpperCase();

        try {
            var job = new CronJob({
                cronTime: cronTime,
                onTick: function() {
                    self.log(self.name + " is sending " + notification);
                    self.sendSocketNotification(notification, null);
                    self.log(self.name + " will next send " + notification + " at " + this.nextDate().toDate() + " based on \"" + cronTime + "\"");
                },
                onComplete: function() {
                    self.log(self.name + " has completed the " + action + " job based on \"" + cronTime + "\"");
                },
                start: true
            });
            return job;
        } catch(ex) {
            this.log(this.name + " could not create " + type + " schedule - check " + action + " expression: \"" + cronTime + "\"");
        }

    },

    getOrMakeArray: function(arrayOrString) {
        if (Array.isArray(arrayOrString)) {
            return arrayOrString;
        } else {
            return [arrayOrString];
        }
    },

    isValidAction: function(action) {
        if(action !== JOB_ACTION_SHOW && action !== JOB_ACTION_HIDE) {
            this.log(this.name + " cannot create schedule. Expected show/hide/dim/send, not " + action);
            return false;
        }
        return true;
    },

    log: function(msg) {
        if (this.config && this.config.debug) {
            console.log(msg);
        }
    },

});