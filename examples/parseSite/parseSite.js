'use strict';
// You'll need to install bluebird, request and cheerio for this to work
var index_1 = require('../../index');
var helpers_1 = require('../../helpers');
var Rx = require('@reactivex/rxjs');
var Observable = Rx.Observable;
var bluebird_1 = require('bluebird');
var url = require('url');
var r = require('request');
var cheerio = require('cheerio');
var request = bluebird_1.promisifyAll(r);
var site = 'http://rkoutnik.com';
var siteSource = index_1.gustav.source('siteSource', function (site) {
    return function () {
        var nextLink;
        var visited = [];
        var getURL = function (urlToScan) {
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
        };
        getURL('/');
        return new Observable(function (o) {
            nextLink = function (page) {
                // If it's a link for us, fire off another request
                page.links.filter(function (link) {
                    var parsed = url.parse(link);
                    return !parsed.host || parsed.host === 'rkoutnik.com';
                })
                    .map(getURL);
                o.next(page);
            };
        });
    };
});
var findTLD = index_1.gustav.transformer('findTLD', function () {
    return function (iO) {
        var seen = [];
        return iO
            .flatMap(function (page) { return Observable.from(page.links.map(function (x) { return url.parse(x); })); })
            .map(function (parsedURL) { return parsedURL.host || 'rkoutnik.com'; })
            .filter(function (str) { return seen.indexOf(str) === -1; })
            .do(function (str) { return seen.push(str); });
    };
})();
var getRkoutnik = siteSource(site);
var out = helpers_1.consoleSink('URL:');
index_1.gustav.addDep(findTLD, getRkoutnik);
index_1.gustav.addDep(out, findTLD);
index_1.gustav.init();
