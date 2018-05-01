const fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var colors = require('colors');
const notifier = require('node-notifier');

var queuedEvents = [];

module.exports = function(events) {

    // If modifying these scopes, delete your previously saved credentials
    // at ~/.credentials/calendar-nodejs-quickstart.json
    var SCOPES = ['https://www.googleapis.com/auth/calendar'];
    var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
        process.env.USERPROFILE) + '/.credentials/';
    var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

    // Load client secrets from a local file.
    fs.readFile('./files/client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // Google Calendar API.
        authorize(JSON.parse(content), addTheEvents);
    });

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     *
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
        var clientSecret = credentials.installed.client_secret;
        var clientId = credentials.installed.client_id;
        var redirectUrl = credentials.installed.redirect_uris[0];
        var auth = new googleAuth();
        var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, function(err, token) {
            if (err) {
                getNewToken(oauth2Client, callback);
            } else {
                oauth2Client.credentials = JSON.parse(token);
                callback(oauth2Client);
            }
        });
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     *
     * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback to call with the authorized
     *     client.
     */
    function getNewToken(oauth2Client, callback) {
        var authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });
        console.log('Authorize this app by visiting this url: ', authUrl);
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Enter the code from that page here: ', function(code) {
            rl.close();
            oauth2Client.getToken(code, function(err, token) {
                if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    return;
                }
                oauth2Client.credentials = token;
                storeToken(token);
                callback(oauth2Client);
            });
        });
    }

    /**
     * Store token to disk be used in later program executions.
     *
     * @param {Object} token The token to store to disk.
     */
    function storeToken(token) {
        try {
            fs.mkdirSync(TOKEN_DIR);
        } catch (err) {
            if (err.code != 'EEXIST') {
                throw err;
            }
        }
        fs.writeFile(TOKEN_PATH, JSON.stringify(token));
        console.log('Token stored to ' + TOKEN_PATH);
    }

    function ISODateString(d) {
        function pad(n) {
            return n < 10 ? '0' + n : n
        }
        return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z'
    }

    function makeGoogleObject(obj) {
        var startDate = new Date(obj.com_microsoft_outlook_startDate);
        var endDate = new Date(obj.com_microsoft_outlook_endDate);
        var now = new Date();
        if (now < startDate) {
            var sampleObject = {
                'summary': obj.ItemTitle,
                'location': obj.ItemCoverage,
                'start': {
                    'dateTime': ISODateString(startDate),
                    'timeZone': 'America/New_York'
                },
                'end': {
                    'dateTime': ISODateString(endDate),
                    'timeZone': 'America/New_York'
                },
                'reminders': {
                    'useDefault': true
                }
            };
            sampleObject.attendees = [];
            if (obj.com_microsoft_outlook_attendees) {
                for (x = 0; x < 10; x++) {
                    sampleObject.attendees.push({ "email": "fake@fake.com", "displayName": obj.com_microsoft_outlook_attendees[x] });
                }
            }
            return sampleObject;
        } else {
            console.log("event already happened");
            return false;
        }

    }

    function addTheEvents(auth) {
        for (u = 0; u < events.length; u++) {
            if (events[u] !== undefined) {
                var event = makeGoogleObject(events[u]);
                if (event !== false) {
                    queuedEvents.push(event);
                }
            }
        }
        addTheQueuedEvents(auth);
    };

    function addTheQueuedEvents(auth) {
        var x = 0;
        var interval = setInterval(function() {
            console.log("this is the number of the event we're on");
            console.log(x);
            if (x < queuedEvents.length) {
                addOneEvent(queuedEvents[x], auth);
                x++;
            } else {
                clearInterval(interval);
                notifier.notify({
                    'title': 'Calendar Updated Lol',
                    'message': queuedEvents.length + ' events updated'
                });
            }

        }, 1500);
    }

    function addOneEvent(obj, auth) {
        var calendar = google.calendar('v3');

        calendar.events.insert({
            auth: auth,
            calendarId: 'mcsnfmbvhta0qddmn0f6df84g8@group.calendar.google.com',
            resource: obj,
        }, function(err, event) {
            if (err) {
                console.log(obj);
                console.log('There was an error contacting the Calendar service: ' + err);
                return;
            }
            console.log('Event created: %s', event.htmlLink);
        });
    }


}
