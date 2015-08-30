/// <reference path="typings/tsd.d.ts" />
/// <reference path="index.ts" />

'use strict';

import core = require('./index');
import fs = require('fs');
import Rx = require('rx');

import t = require('tail');
let Tail = t.Tail;

// Reads lines from a file live & emits them
// https://github.com/lucagrulla/node-tail
export class FileSource extends core.Source {
  constructor(
    public filename: string,
    public lineSeparator = '\n',
    public watchOptions = {},
    public fromStart = false
  ) {
    super();
  }
  run() {
    let logTail = new Tail(
      this.filename,
      this.lineSeparator,
      this.watchOptions,
      this.fromStart
    );
    return Rx.Observable.create(o => {
      logTail.on('line', (line) => o.onNext(line));
      logTail.on('err', (err) => o.onError(err));
      logTail.on('end', () => o.onCompleted());
    }).publish().refCount();
  }
}

// Untested, no clue if worky.  TODO
import pg = require('pg');
import bluebird = require('bluebird');

bluebird.promisifyAll(pg);
bluebird.promisifyAll(pg.Client.prototype);

export class PostgresSource extends core.Source {
  exec: Function;
  constructor(public config:any) {
    super();
    // connect to pg
    this.exec = fn => {
      let close;
      return pg.connectAsync(this.config.connString).spread(function(client, _close) {
        close = _close;
        return fn(client);
      }).finally(function() {
        if (close) {
          close();
          pg.end();
        }
      });
    };
  }
  run () {
    // Get data from something
    return Rx.Observable.create(o => {
      this.exec((db) => db.queryAsync(this.config.query))
      .then((data) => {
        data.rows.forEach(datum => o.onNext(datum));
        o.onCompleted();
      });
    });
  }
}