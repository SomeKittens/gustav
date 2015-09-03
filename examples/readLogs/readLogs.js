/// <reference path="../../index.ts" />
/// <reference path="../../typings/tsd.d.ts" />
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
// Trigger writing to the logs
require('./genLogs');
var index_1 = require('../../index');
var helpers_1 = require('../../helpers');
var HTTPFileSource = (function (_super) {
    __extends(HTTPFileSource, _super);
    function HTTPFileSource() {
        _super.call(this, './httplogs', '\n', {}, true);
    }
    return HTTPFileSource;
})(helpers_1.FileSource);
var HTTPSplitter = (function (_super) {
    __extends(HTTPSplitter, _super);
    function HTTPSplitter() {
        _super.apply(this, arguments);
    }
    HTTPSplitter.prototype.run = function (inputObservable) {
        return inputObservable
            .map(function (str) {
            var split = str.split(' ');
            return {
                route: split[0],
                status: split[1]
            };
        });
    };
    HTTPSplitter.dependencies = HTTPFileSource;
    return HTTPSplitter;
})(index_1["default"].Transformer);
var ConsoleSink = (function (_super) {
    __extends(ConsoleSink, _super);
    function ConsoleSink() {
        _super.call(this, 'File Logs');
    }
    ConsoleSink.dependencies = HTTPSplitter;
    return ConsoleSink;
})(helpers_1.LogSink);
index_1["default"].init(ConsoleSink);
