'use strict';

import {gustav} from '../index';

import {
  consoleSink,
  logParser,
  logGenerator,
  times,
  numberGen
} from './classes';

// defaults to two
let timesTwo = times();
let timesSeven = times(7);
let logMe = consoleSink('me');
let twoConsoleSink = consoleSink('two');
let logParse = logParser();
let numGen = numberGen();

gustav.addDep(logMe, timesTwo);
gustav.addDep(logMe, timesSeven);
gustav.addDep(timesTwo, numGen);
gustav.addDep(timesSeven, numGen);

gustav.addDep(consoleSink(), logParse);
gustav.addDep(logParse, logGenerator());

// Using symbols means the following is an error:
// We're creating two different logParsers.
// gustav.addDep(consoleSink(), logParser());
// gustav.addDep(logParser(), logGenerator());

gustav.init();