# Outlook to Google Calendar Exporter
## Use at your own risk

A super simple Microsoft Outlook Calendar exporter to Google Calendar. This was created so I could secretly export my meetings at a job where the exchange server used SSO. There's probably a smarter way to do this, but this was my stupid workaround.

There are a great deal of issues with it. but here's the gist:

## How

Node reads Outlook's meeting files -> Node consults a json it writes to about whether it has exported them yet -> Node imports and reads files -> files are exported to Google -> then you get fired because you were taking company info off-location


## Setup

1. `Npm install`
2. Setup a developer project on google that uses calendar api
3. `node setupAPI.js` (this is the stock google calendar API setup), this will set it up with your google account
4. As it instructs, put client secret info in a file called client_secret.json, then put it in ./files folder
5. Change your user folder in outlook.js
6. Setup a cron job to run this (example included)
