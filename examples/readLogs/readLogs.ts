'use strict';

// Trigger writing to the logs
require('./genLogs');

import {gustav} from '../../index';

import {
  fileSource,
  consoleSink
} from '../../helpers';

let splitHTTPLogs = gustav.transformer('splitHTTPLogs', () => {
  return (iO) => {
    return iO
      .map((str) => {
        let split = str.split(' ');
        return {
          route: split[0],
          status: split[1]
        };
      });
  };
})();

let logFile = fileSource('./httplogs');
let out = consoleSink('HTTP logs');

gustav.addDep(out, splitHTTPLogs);
gustav.addDep(splitHTTPLogs, logFile);

gustav.init();