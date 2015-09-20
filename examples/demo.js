'use strict';
var index_1 = require('../index');
var classes_1 = require('./classes');
// defaults to two
var timesTwo = classes_1.times();
var timesSeven = classes_1.times(7);
var logMe = classes_1.consoleSink('me');
var twoConsoleSink = classes_1.consoleSink('two');
var logParse = classes_1.logParser();
var numGen = classes_1.numberGen();
index_1.gustav.addDep(logMe, timesTwo);
index_1.gustav.addDep(logMe, timesSeven);
index_1.gustav.addDep(timesTwo, numGen);
index_1.gustav.addDep(timesSeven, numGen);
index_1.gustav.addDep(classes_1.consoleSink(), logParse);
index_1.gustav.addDep(logParse, classes_1.logGenerator());
// Using symbols means the following is an error:
// We're creating two different logParsers.
// gustav.addDep(consoleSink(), logParser());
// gustav.addDep(logParser(), logGenerator());
index_1.gustav.init();
