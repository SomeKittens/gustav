'use strict';
// Require so we can point to the compiled version in dist
var gustav = require('../dist/index').gustav;
var Rx = require('@reactivex/rxjs');
var Observable = Rx.Observable;
exports.logGenerator = gustav.source('logGenerator', function (options) {
    console.log('logGenerator', options);
    return function () {
        return new Observable(function (o) {
            var urls = ['/', '/user', '/pricing', '/admin'];
            var statuses = [200, 200, 200, 200, 200, 200, 200, 200, 200, 400, 400, 400, 404, 404, 404, 500, 500, 500];
            var writeToLogs = function () {
                var url = urls[Math.floor(Math.random() * 4)];
                var status = statuses[Math.floor(Math.random() * statuses.length)];
                o.next(url + ' ' + status);
            };
            var interval = setInterval(writeToLogs, 100);
            return function () {
                clearInterval(interval);
            };
        });
    };
});
exports.numberGen = gustav.source('numberGen', function (interval) {
    if (interval === void 0) { interval = 150; }
    return function () {
        return Observable.interval(interval);
    };
});
exports.logParser = gustav.transformer('logParser', function () {
    return function (iO) {
        console.log(iO);
        return iO.map(function (logLine) {
            var arr = logLine.split(' ');
            return {
                status: arr[1],
                url: arr[0]
            };
        });
    };
});
exports.times = gustav.transformer('times', function (mulitplier) {
    if (mulitplier === void 0) { mulitplier = 2; }
    return function (iO) {
        return iO.map(function (num) { return num * mulitplier; });
    };
});
exports.square = gustav.transformer('square', function () {
    return function (iO) {
        return iO.map(function (num) { return num * num; });
    };
});
exports.consoleSink = gustav.sink('consoleSink', function (prefix) {
    if (prefix === void 0) { prefix = 'Gustav'; }
    return function (iO) {
        iO.forEach(console.log.bind(console, prefix), console.log.bind(console, prefix), console.log.bind(console, prefix));
    };
});
