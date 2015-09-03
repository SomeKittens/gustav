/// <reference path="../../index.ts" />
/// <reference path="../../typings/tsd.d.ts" />
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var index_1 = require('../../index');
var rx_1 = require('rx');
var bluebird_1 = require('bluebird');
var url = require('url');
var r = require('request');
var cheerio = require('cheerio');
var request = bluebird_1.promisifyAll(r);
var site = 'http://rkoutnik.com';
var SiteSource = (function (_super) {
    __extends(SiteSource, _super);
    function SiteSource() {
        _super.apply(this, arguments);
    }
    SiteSource.prototype.run = function () {
        var nextLink;
        var visited = [];
        function getURL(urlToScan) {
            urlToScan = urlToScan.replace(/#.*/, '');
            var parsedURL = url.parse(urlToScan);
            if (!parsedURL.host) {
                urlToScan = site + urlToScan;
            }
            if (visited.indexOf(urlToScan) > -1) {
                return;
            }
            visited.push(urlToScan);
            request.getAsync(urlToScan)
                .spread(function (res, body) {
                var links = cheerio
                    .load(body)('a')
                    .map(function (i, link) { return link.attribs.href; })
                    .get();
                nextLink({
                    links: links,
                    url: urlToScan
                });
            });
        }
        getURL('/');
        return rx_1.Observable.create(function (o) {
            nextLink = function (page) {
                // If it's a link for us, fire off another request
                page.links.filter(function (link) {
                    var parsed = url.parse(link);
                    return !parsed.host || parsed.host === 'rkoutnik.com';
                })
                    .map(getURL);
                o.onNext(page);
            };
        });
    };
    return SiteSource;
})(index_1["default"].Source);
var FindTLD = (function (_super) {
    __extends(FindTLD, _super);
    function FindTLD() {
        _super.apply(this, arguments);
    }
    FindTLD.prototype.run = function (iO) {
        var seen = [];
        return iO
            .flatMap(function (page) { return rx_1.Observable.from(page.links, function (x) { return url.parse(x); }); })
            .map(function (parsedURL) { return parsedURL.host || 'rkoutnik.com'; })
            .filter(function (str) { return seen.indexOf(str) === -1; })
            .do(function (str) { return seen.push(str); });
    };
    FindTLD.dependencies = SiteSource;
    return FindTLD;
})(index_1["default"].Transformer);
var LogLoader = (function (_super) {
    __extends(LogLoader, _super);
    function LogLoader() {
        _super.apply(this, arguments);
    }
    LogLoader.prototype.run = function (iO) {
        iO.subscribe(
        // noop,
        // noop,
        function (obj) { return console.log('result', url.format(obj)); }, function (err) { return console.log(err); }, function () { return console.log('done'); });
    };
    LogLoader.dependencies = FindTLD;
    return LogLoader;
})(index_1["default"].Sink);
function noop() {
    var items = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        items[_i - 0] = arguments[_i];
    }
}
index_1["default"].init(LogLoader);
