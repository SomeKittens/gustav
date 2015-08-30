'use strict';

var fs = require('fs');

var urls = [
  '/',
  '/user',
  '/pricing',
  '/admin'
];

var statuses = [
  200,
  200,
  200,
  200,
  200,
  200,
  200,
  200,
  200,
  400,
  400,
  400,
  404,
  404,
  404,
  500,
  500,
  500
];

var s = fs.createWriteStream('./httplogs');

function writeToLogs() {
  var url = urls[Math.floor(Math.random() * 4)];
  var status = statuses[Math.floor(Math.random() * statuses.length)];
  s.write(url + ' ' + status + '\n');
}

setInterval(writeToLogs, 100);