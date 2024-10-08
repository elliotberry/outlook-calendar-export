import fs from 'fs/promises'; // Using fs/promises for async file operations
import path from 'path';
import walk from 'walk';
import { exec } from 'child_process';
import {homedir} from 'os';
import calendar from './calendar.js';
import util from 'util';

const log_file = fs.createWriteStream('./files/debug.log', { flags: 'w' });
const log_stdout = process.stdout;

console.log = d => {
  log_file.write(`${util.format(d)}\n`);
  log_stdout.write(`${util.format(d)}\n`);
};

//get user folder
const userFolder = homedir() || process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const dir = `${userFolder}Library/Group Containers/UBF8T346G9.Office/Outlook/Outlook 15 Profiles/Main Profile/Data/Events/`;

let indexed = [];
const files = [];
const allTheInfo = [];

// Read the events we've already read.
async function readIndexedFiles() {
  try {
    const data = await fs.readFile('./files/indexed.json', 'utf-8');
    if (data) {
      indexed = JSON.parse(data);
      console.log('Read the indexed files');
    }
  } catch (err) {
    console.error(err);
  }
}


// Functions used.
const parseCmd = async () => {
  console.log('Parsing valid file data.');
  for (const out of outs) {
    allTheInfo.push(deserialize(out));
  }

  try {
    await fs.writeFile('./files/indexed.json', JSON.stringify(indexed));
    console.log('Wrote parsed files to registry');
  } catch (err) {
    console.error(err);
  }

  console.log('Sending all events to calendar...');
  if (allTheInfo.length) {
    calendar(allTheInfo);
  }
};

// Read data from outlook files.
const getTheData = async x => {
  if (x >= files.length) {
    await parseCmd();
    return;
  }

  const thisOne = files[x].replace(
    `${userFolder}Library/Group\ Containers/UBF8T346G9.Office/Outlook/Outlook\ 15\ Profiles/Main\ Profile/Data/Events/`,
    `${userFolder}Library/Group\ Containers/UBF8T346G9.Office/Outlook/Outlook\ 15\ Profiles/Main\ Profile/Data/Events/`
  );

  console.log(thisOne);

  if (indexed.includes(thisOne) || !thisOne.includes('olk')) {
    console.log('In array or not a good file');
    getTheData(x + 1);
  } else {
    try {
      const cmd = `mdls ${thisOne}`;
      const stdout = await execAsync(cmd);
      indexed.push(thisOne);
      outs.push(stdout);
      getTheData(x + 1);
    } catch (error) {
      console.error(error);
      getTheData(x + 1);
    }
  }
};

function deserialize(raw_data) {
  const splits = raw_data.split('\n').map(line => line.trim()).filter(line => line);

  const data = {};
  for (const line of splits) {
    const [key, value] = line.split('=').map(part => part.trim());
    const cleanedKey = key.replace('kMD', '');
    data[cleanedKey] = parseValue(cleanedKey, value);
  }

  allTheInfo.push(data);
}

function parseValue(key, value) {
  if (value.startsWith('(') && value.endsWith(')')) {
    return value.slice(1, -1).split(',').map(item => toJsType(key)(item.trim()));
  }
  return toJsType(key)(value);
}

function toJsType(key) {
  return value => {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    const numVal = Number(value);
    return isNaN(numVal) ? value : numVal;
  };
}

function execAsync(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

const main = async () => {
  await readIndexedFiles();
  const walker = walk.walk(dir, { followLinks: true });
  walker.on('file', (root, { name }, next) => {
    files.push(path.join(root, name));
    next();
  });

  walker.on('end', () => {
    console.log(`Found ${files.length} files in Outlook directory. Getting data from them.`);
    getTheData(0);
  });
};

main();