/// <reference path="typings/tsd.d.ts" />
/// <reference path="index.ts" />
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var core = require('./index');
var Rx = require('rx');
var t = require('tail');
var Tail = t.Tail;
// Reads lines from a file live & emits them
// https://github.com/lucagrulla/node-tail
var FileSource = (function (_super) {
    __extends(FileSource, _super);
    function FileSource(filename, lineSeparator, watchOptions, fromStart) {
        if (lineSeparator === void 0) { lineSeparator = '\n'; }
        if (watchOptions === void 0) { watchOptions = {}; }
        if (fromStart === void 0) { fromStart = false; }
        _super.call(this);
        this.filename = filename;
        this.lineSeparator = lineSeparator;
        this.watchOptions = watchOptions;
        this.fromStart = fromStart;
    }
    FileSource.prototype.run = function () {
        var logTail = new Tail(this.filename, this.lineSeparator, this.watchOptions, this.fromStart);
        return Rx.Observable.create(function (o) {
            logTail.on('line', function (line) { return o.onNext(line); });
            logTail.on('err', function (err) { return o.onError(err); });
            logTail.on('end', function () { return o.onCompleted(); });
        }).publish().refCount();
    };
    return FileSource;
})(core.Source);
exports.FileSource = FileSource;
// Untested, no clue if worky.  TODO
var pg = require('pg');
var bluebird = require('bluebird');
bluebird.promisifyAll(pg);
bluebird.promisifyAll(pg.Client.prototype);
var PostgresSource = (function (_super) {
    __extends(PostgresSource, _super);
    function PostgresSource(config) {
        var _this = this;
        _super.call(this);
        this.config = config;
        // connect to pg
        this.exec = function (fn) {
            var close;
            return pg.connectAsync(_this.config.connString).spread(function (client, _close) {
                close = _close;
                return fn(client);
            }).finally(function () {
                if (close) {
                    close();
                    pg.end();
                }
            });
        };
    }
    PostgresSource.prototype.run = function () {
        var _this = this;
        // Get data from something
        return Rx.Observable.create(function (o) {
            _this.exec(function (db) { return db.queryAsync(_this.config.query); })
                .then(function (data) {
                data.rows.forEach(function (datum) { return o.onNext(datum); });
                o.onCompleted();
            });
        });
    };
    return PostgresSource;
})(core.Source);
exports.PostgresSource = PostgresSource;
