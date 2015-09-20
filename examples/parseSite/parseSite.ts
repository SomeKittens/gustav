'use strict';

// You'll need to install bluebird, request and cheerio for this to work

import {gustav} from '../../index';
import {consoleSink} from '../../helpers';

let Rx = require('@reactivex/rxjs');
let Observable = Rx.Observable;
import {promisifyAll} from 'bluebird';
import * as url from 'url';
import * as r from 'request';
import * as cheerio from 'cheerio';

let request = promisifyAll(r);
let site = 'http://rkoutnik.com';

let siteSource = gustav.source('siteSource', (site: string) => {
  return () => {
    let nextLink;
    let visited = [];
    let getURL = (urlToScan) => {
      urlToScan = urlToScan.replace(/#.*/, '');
      let parsedURL = url.parse(urlToScan);
      if (!parsedURL.host) {
        urlToScan = site + urlToScan;
      }
      if (visited.indexOf(urlToScan) > -1) {
        return;
      }
      visited.push(urlToScan);
      request.getAsync(urlToScan)
      .spread((res, body) => {
        var links = cheerio
          .load(body)('a')
          .map((i, link) => link.attribs.href)
          .get();

        nextLink({
          links,
          url: urlToScan
        });
      });
    }

    getURL('/');

    return new Observable((o) => {
      nextLink = (page) => {
        // If it's a link for us, fire off another request
        page.links.filter(link => {
          let parsed = url.parse(link);
          return !parsed.host || parsed.host === 'rkoutnik.com';
        })
        .map(getURL);
        o.next(page);
      };
    });
  };
});

let findTLD = gustav.transformer('findTLD', () => {
  return (iO) => {
    let seen = [];
    return iO
      .flatMap(page => Observable.from(page.links.map(x => url.parse(x))))
      .map(parsedURL => parsedURL.host || 'rkoutnik.com')
      .filter(str => seen.indexOf(str) === -1)
      .do(str => seen.push(str));
  }
})();

let getRkoutnik = siteSource(site);
let out = consoleSink('URL:');

gustav.addDep(findTLD, getRkoutnik);
gustav.addDep(out, findTLD);

gustav.init();