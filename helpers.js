'use strict';
var index_1 = require('./index');
var fs_1 = require('fs');
var Rx = require('@reactivex/rxjs');
var Observable = Rx.Observable;
// TODO: .d.ts for tail
// import {Tail} from 'tail';
var Tail = require('tail').Tail;
exports.fileSource = index_1.gustav.source('fileSource', function (config) {
    if (typeof config === 'string') {
        config = { filename: config };
    }
    var tailConfig = {
        filename: config.filename,
        lineSeparator: config.lineSeparator || '\n',
        watchOptions: config.watchOptions || {},
        fromStart: config.fromStart || false
    };
    return function () {
        var logTail = new Tail(tailConfig.filename, tailConfig.lineSeparator, tailConfig.watchOptions, tailConfig.fromStart);
        return new Observable(function (o) {
            logTail.on('line', function (line) { return o.next(line); });
            logTail.on('err', function (err) { return o.error(err); });
            logTail.on('end', function () { return o.complete(); });
        });
    };
});
exports.consoleSink = index_1.gustav.sink('consoleSink', function (prefix) {
    if (prefix === void 0) { prefix = 'Gustav:'; }
    return function (iO) {
        iO.forEach(console.log.bind(console, prefix), console.log.bind(console, prefix), console.log.bind(console, prefix));
    };
});
exports.fileSink = index_1.gustav.sink('FileSink', function (filename) {
    return function (iO) {
        // Clear the file
        fs_1.writeFileSync(filename, '');
        iO.forEach(function (arr) { return arr.forEach(function (title) { fs_1.appendFileSync(filename, title + '\n'); }); }, function (err) { return console.log('err', err); }, function () { console.log('Finished'); fs_1.appendFileSync(filename, '**done**\n'); });
    };
});
