# Outlook to Google Calendar Exporter

Use at your own risk. I have only tested this on mac in 2019, and I'm not very good at software development.

A super simple Microsoft Outlook Calendar exporter to Google Calendar. This was created so I could secretly export my meetings at a job where the exchange server used SSO. There's probably a smarter way to do this, but this was my stupid workaround, and I'm proud of my stupidity.

Here's the gist:

## What it does

1. Node reads Outlook's meeting files
2. Node consults a json file to about whether it has exported them yet
3. Node imports and reads files
4. Files are exported to Google with its calendar api
5. You get fired because you were taking company information off-location

## Setup

1. `Npm install`
2. Setup a developer project on google cloud that uses calendar api so that you may access it with your gcli creds
3. `node setupAPI.js` (this is the stock google calendar API setup), this will set it up with your google account
4. As it instructs, put client secret info in a file called client_secret.json, then put it in ./files folder
5. Change your user folder in outlook.js
6. Setup a cron job to run this (example included)
