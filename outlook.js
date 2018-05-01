const fs = require('fs');
const path = require('path');
var walk = require('walk');
var exec = require('child_process').exec;
var replaceall = require("replaceall");
var outs = [];
var files = [];
var fullData = [];
var allTheInfo = [];
var indexed = [];
var registry = [];
var calendar = require('./calendar');
var util = require('util');
var log_file = fs.createWriteStream('./files/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

//Log Console to files
console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};



var userFolder = '/Users/eberry/'; //Replace this with your user folder, lol
var dir = userFolder + 'Library/Group Containers/UBF8T346G9.Office/Outlook/Outlook 15 Profiles/Main Profile/Data/Events/';


//
// The runtime of the script.
//
//Read the events we've already read.
fs.readFile('./files/indexed.json', "utf-8", function read(err, data) {
    if (err) {
        throw err;
    }
    var content = data;
    if (content) {
        indexed = JSON.parse(content);
        console.log("Read the indexed files");
    }

});

//Walker walks directory of outlook events to find new files, etc.
var walker = walk.walk(dir, { followLinks: true });
walker.on('file', function(root, stat, next) {
    // Add this file to the list of files
    files.push(root + '/' + stat.name);
    next();
});
walker.on('end', function() {
    console.log("found " + files.length + " files in Outlook directory. Getting data from them.");
    getTheData(2);
});



//
// Functions used.
//
var parseCmd = function() {
    console.log("Parsing valid file data.");
    for (y = 0; y < outs.length; y++) {
        console.log(y);
        allTheInfo.push(deserialize(outs[y]));
    }
    fs.writeFile('./files/indexed.json', JSON.stringify(indexed), function(err) {
        if (err) return console.log(err);
        console.log('Wrote parsed files to registry');
    });
    console.log("Sending all events to calendar...");
    if (allTheInfo) {
        calendar(allTheInfo);  
    }
}

Array.prototype.contains = function(element) {
    return this.indexOf(element) > -1;
};

//Read data from outlook files. This is a loop that repeats itself recursively?
var getTheData = function(x) {
    if (x < files.length) {
        var thisOne = files[x].replace(userFolder + "Library/Group Containers/UBF8T346G9.Office/Outlook/Outlook 15 Profiles/Main Profile/Data/Events/", userFolder + "Library/Group\\ Containers/UBF8T346G9.Office/Outlook/Outlook\\ 15\\ Profiles/Main\\ Profile/Data/Events/");
        console.log(thisOne);
        //if the file has been indexed, or is not correct file?
        if (indexed.contains(thisOne) || thisOne.indexOf("olk") < 0) {
            console.log("in array or not a good file");
            getTheData(x + 1);
        } else {
            var cmd = 'mdls ' + thisOne;
            exec(cmd, function(error, stdout, stderr) {
                indexed.push(thisOne);
                outs.push(stdout);
                getTheData(x + 1);
            });
        }
    } else {
        parseCmd();
    }
}


function deserialize(raw_data) {
    var splits = raw_data.split('\n') // only targets osx
        ,
        lines = [],
        data = {}

    for (var i = 0, len = splits.length; i < len; ++i) {
        if (splits[i].indexOf('=') === -1) {
            lines[lines.length - 1] = lines[lines.length - 1] + splits[i].trim()

            continue
        }

        lines[lines.length] = splits[i].trim()
    }

    var value, key, kv

    for (var i = 0, len = lines.length; i < len; ++i) {
        kv = lines[i].split('=')
        key = kv[0].trim().replace('kMD', '')
        value = kv[1].trim()

        if (value[0] === '(' && value[value.length - 1] === ')') {
            value = value.slice(1, -1).split(',').map(to_js_type(key))
        } else {
            value = to_js_type(key)(value)
        }

        data[key] = value
    }

    allTheInfo.push(data);
}

function to_js_type(key) {
    return function(value) {
        if (value[0] === '"' && value[value.length - 1] === '"') {
            return value.slice(1, -1)
        }

        var as_num = +value

        if (!isNaN(as_num)) {
            return as_num
        } else {
            return value;
        }


    }
}

function bad_value(key, value) {
    throw new Error('invalid value: ' + value + ' for key: ' + key)
}
