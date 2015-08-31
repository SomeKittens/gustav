/// <reference path="../../index.ts" />
/// <reference path="../../typings/tsd.d.ts" />

'use strict';

import Gustav from '../../index';

import {Observable} from 'rx';
import {promisifyAll} from 'bluebird';
import * as url from 'url';
import * as r from 'request';
import * as cheerio from 'cheerio';

let request = promisifyAll(r);
let site = 'http://rkoutnik.com';

class SiteSource extends Gustav.Source {
  run() {
    let nextLink;
    let visited = [];
    function getURL(urlToScan) {
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
    return Observable.create((o) => {
      nextLink = (page) => {
        // If it's a link for us, fire off another request
        page.links.filter(link => {
          let parsed = url.parse(link);
          return !parsed.host || parsed.host === 'rkoutnik.com';
        })
        .map(getURL);
        o.onNext(page);
      };
    });
  }
}

class FindTLD extends Gustav.Transformer {
  static dependencies = SiteSource;
  run (iO: Observable<any>) {
    let seen = [];
    return iO
    .flatMap(page => Observable.from(page.links, x => url.parse(x)))
    .map(parsedURL => parsedURL.host || 'rkoutnik.com')
    .filter(str => seen.indexOf(str) === -1)
    .do(str => seen.push(str));
  }
}

class LogLoader extends Gustav.Sink {
  static dependencies = FindTLD;
  run(iO: Observable<any>) {
    iO.subscribe(
      // noop,
      obj => console.log('result', url.format(obj)),
      err => console.log(err),
      () => console.log('done')
    );
  }
}
function noop(...items:Array<any>) {}

Gustav.init(LogLoader);
