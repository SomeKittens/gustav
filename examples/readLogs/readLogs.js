'use strict';
// Trigger writing to the logs
require('./genLogs');
var index_1 = require('../../index');
var helpers_1 = require('../../helpers');
var splitHTTPLogs = index_1.gustav.transformer('splitHTTPLogs', function () {
    return function (iO) {
        return iO
            .map(function (str) {
            var split = str.split(' ');
            return {
                route: split[0],
                status: split[1]
            };
        });
    };
})();
var logFile = helpers_1.fileSource('./httplogs');
var out = helpers_1.consoleSink('HTTP logs');
index_1.gustav.addDep(out, splitHTTPLogs);
index_1.gustav.addDep(splitHTTPLogs, logFile);
index_1.gustav.init();
