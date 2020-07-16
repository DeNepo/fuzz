/*
  this file opens a server that can only send files after reading them directly from the file system
  files are accessed by trying to find a file path matching the url path exactly
  it keeps a log of each request/response cycle in /server-logs
*/

// require other people's code to use it in this script
//  these dependencies all come pre-installed with node
// const http = require('http');
// const fs = require('fs');
// const path = require('path');
import http from 'http';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));


// declare constant values to use throught the script
//  on which port to open the server
//    you see this number appear in the console as localhost:XXXX
const PORT = process.env.PORT || 3000;
//  which folder to write logs into
const LOG_DIRNAME = `server-logs`;
//  create an absolute path to that folder, compatible on different operating systems
const LOG_DIR = path.join(__dirname, LOG_DIRNAME);
//  create a path to this study sessions log file, the file is named after the current date and time
//    replaces : with _ so that LOG_PATH works on windows & unix
const LOG_PATH = path.join(LOG_DIR, `${(new Date()).toJSON().replace(/:/g, '_')}.txt`);
//  configure how many logs to store.  extra logs will be deleted
const LOGS_LIMIT = 20;

//  keep track of how many request/response cycles happen
//    this number appears in the console as X. req: & X. res:
let cycles = 0;

// check if the LOG_DIR folder exists
if (fs.existsSync(LOG_DIR)) {
  //  get an array of all file names in the LOG_DIR folder
  const logs = fs.readdirSync(LOG_DIR);
  //  if there are too many logs (more than LOGS_LIMIT), delete the extra ones
  if (logs.length > LOGS_LIMIT) {
    console.log('--- clearing ' + (logs.length - LOGS_LIMIT) + ' old logs ---');
    // loop through all the extra files, deleteing from oldest to newest
    for (let i = 0; i < logs.length - LOGS_LIMIT; i++) {
      // create an apsolute path to the log
      const oldLog = path.join(LOG_DIR, logs[i]);
      // "delete" it. this actually just tells the computer to forget where it is
      //  it won't show up in the folder, but is still on your hardrive until it's garbage collected
      fs.unlinkSync(oldLog);
    };
  };
} else {
  console.log(`--- creating ${LOG_DIRNAME} directory ---`);
  // create the LOG_DIR folder if it didn't exist (an error was thrown)
  fs.mkdirSync(LOG_DIR);
}

const log = (msg) => {
  // remove your folder's file path from any error messages
  //  so they're easier to read
  //  and so you don't share that information on github
  const cleanedMsg = msg.split(__dirname).join(' ... ');
  // log the message to the console
  console.log(cleanedMsg);
  // write the message to a log file for a "permanent" record
  fs.appendFileSync(LOG_PATH, cleanedMsg + '\n');
};

// what type of response data to send, based on the file name the user requested
//  ie. an html file will be sent as type 'text/html'
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
};


console.log('\n--- launching server ---\n');

// declare the function that will be called every time you send a request from your browser to the server
const handleRequest = (req, res) => {
  // add 1 to cycle - this counts how many times you've asked the server for a file
  const cycle = ++cycles;

  // checks the request to know how you are studying the code (debugger, js tutor)
  const studyMode = req.headers.study
    ? JSON.stringify({ study: req.headers.study })
    : '';
  // log the request to console and the file system
  log(`${cycle}. req: ${req.method} ${req.url} ${studyMode}`);

  // ignore request parameters
  const reqUrlMinusParams = req.url.split('?')[0];

  // if the browser's url is just localhost:3000, send index.html
  // else send the file matching the url path
  //  try going to localhost:3000/index.json and see what happens
  const relPath = reqUrlMinusParams === '/'
    ? './index.html'
    : decodeURIComponent(reqUrlMinusParams);

  const requestedFilePath = path.normalize(path.join(__dirname, relPath));

  // determining what type of file was requested (ie. .js, .html)
  const extension = String(path.extname(relPath)).toLowerCase();
  // use the object declared higher up to decide how to classify the content
  const contentType = mime[extension] || 'application/octet-stream';

  // declare the function that will be called after the computer tries to find the requested file
  const serveFile = (error, content) => {
    // begin a string to describe what is happening, this will be logged to the console and the log file
    let logMsg = '';
    // if something when wrong while trying to read the file
    if (error) {
      // if the file didn't exist: try going to localhost:3000/turtles.js in your browser
      if (error.code === 'ENOENT') {
        // send a 404 page
        const html404 = `<!DOCTYPE html><html><head><title>404</title></head><body><h1>404: ${relPath}</h1></body></html>`;
        // set the status to 404
        res.writeHead(404, { 'Content-Type': 'text/html' });
        // send the response
        res.end(html404, 'utf-8');
        // assign the logMsg to say the the file didn't exit
        logMsg = 'response: 404 ' + relPath;
      } else {
        // any other type of error
        //  if this happens, it was the server's fault not yours
        const errMsg = `Server error: ${error.code} ..`;
        res.writeHead(500);
        res.end(errMsg);
        res.end();
        // assign the error message to the logMsg
        logMsg = errMsg;
      }
    } else {
      // set the status to 200 - OK
      res.writeHead(200, { 'Content-Type': contentType });
      // send the file content encoded as a `utf-8` string
      res.end(content, 'utf-8');
      // assign a value to the logMsg
      logMsg = 'res: ' + relPath;
    };
    // call log with the cycle number and the new message
    //  this will be printed to the console
    //  and added to the log file
    log(cycle + '. ' + logMsg);
  };

  // try to find the requested file
  //  node will call serverFile after it tries to find the file, whether it worked or not
  fs.readFile(requestedFilePath, serveFile);

};

// declare what to do after trying to start the entire server
const listeningCB = (err) => {
  if (err) {
    log(err.stack);
  } else {
    log('Server running at http://localhost:' + PORT + '/');
  };
}

// create a server that calls handleRequest each time it recieves a request from the browser
http
  .createServer(handleRequest)
  // tell node what port to listen on, and what function to call after opening the server (or failing to)
  .listen(PORT, listeningCB);

// what to do when the server is turned off
process.on('exit', function onExit(code) {
  log('process.exit with code ' + code);
});

// what to do when you type ctr-c in the console, turning off the server
process.on('SIGINT', function onSIGINT() {
  log('\nstopping server ...');
  process.exit(0);
});

// what to do if something mysterious goes wrong
process.on('uncaughtException', function onUncaughtException(e) {
  log('- uncaughtException -\n' + e.stack);
  process.exit(99);
});
