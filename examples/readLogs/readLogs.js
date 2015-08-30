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
var gustav = require('../../index');
var helpers = require('../../helpers');
var HTTPFileSource = (function (_super) {
    __extends(HTTPFileSource, _super);
    function HTTPFileSource() {
        _super.call(this, './httplogs', '\n', {}, true);
    }
    return HTTPFileSource;
})(helpers.FileSource);
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
})(gustav.Transformer);
var ConsoleLoader = (function (_super) {
    __extends(ConsoleLoader, _super);
    function ConsoleLoader() {
        _super.apply(this, arguments);
    }
    ConsoleLoader.prototype.run = function (inputObservable) {
        inputObservable.subscribe(function (obj) { return console.log(obj); }, function (err) { return console.log('err: ', err); }, function () { return console.log('Done'); });
    };
    ConsoleLoader.dependencies = HTTPSplitter;
    return ConsoleLoader;
})(gustav.Sink);
gustav.init(ConsoleLoader);
