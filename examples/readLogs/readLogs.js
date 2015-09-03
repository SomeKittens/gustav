/// <reference path="../../index.ts" />
/// <reference path="../../typings/tsd.d.ts" />
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
// Trigger writing to the logs
require('./genLogs');
var index_1 = require('../../index');
var helpers_1 = require('../../helpers');
var decorators_1 = require('../../decorators');
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
    Object.defineProperty(HTTPSplitter.prototype, "run",
        __decorate([
            decorators_1.logWithName('decorate')
        ], HTTPSplitter.prototype, "run", Object.getOwnPropertyDescriptor(HTTPSplitter.prototype, "run")));
    return HTTPSplitter;
})(index_1["default"].Transformer);
var ConsoleLoader = (function (_super) {
    __extends(ConsoleLoader, _super);
    function ConsoleLoader() {
        _super.call(this, 'File Logs');
    }
    ConsoleLoader.dependencies = HTTPSplitter;
    return ConsoleLoader;
})(helpers_1.LogSink);
index_1["default"].init(ConsoleLoader);
