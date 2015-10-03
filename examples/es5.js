'use strict';

var gustav = require('../dist/index').gustav;
var helpers = require('./classes');

// defaults to two
var timesTwo = helpers.times();
var timesSeven = helpers.times(7);
var logMe = helpers.consoleSink('me');
var twoConsoleSink = helpers.consoleSink('two');
var logParse = helpers.logParser();
var numGen = helpers.numberGen();

gustav.addDep(logMe, timesTwo);
gustav.addDep(logMe, timesSeven);
gustav.addDep(timesTwo, numGen);
gustav.addDep(timesSeven, numGen);

// Using symbols means the following is an error:
// We're creating two different logParsers.
// gustav.addDep(consoleSink(), logParser());
// gustav.addDep(logParser(), logGenerator());

gustav.init();