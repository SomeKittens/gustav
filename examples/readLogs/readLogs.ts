/// <reference path="../../index.ts" />
/// <reference path="../../typings/tsd.d.ts" />

'use strict';

// Trigger writing to the logs
require('./genLogs');

import Gustav = require('../../index');
import helpers = require('../../helpers');

import Rx = require('rx');

class HTTPFileSource extends helpers.FileSource {
  constructor() {
    super('./httplogs', '\n', {}, true);
  }
}

class HTTPSplitter extends Gustav.Transformer {
  static dependencies = HTTPFileSource;
  run(inputObservable:Rx.Observable<any>) {
    return inputObservable
    .map((str) => {
      let split = str.split(' ');
      return {
        route: split[0],
        status: split[1]
      };
    });
  }
}

class ConsoleLoader extends Gustav.Sink {
  static dependencies = HTTPSplitter;
  run(inputObservable:Rx.Observable<Object>) {
    inputObservable.subscribe(
      obj => console.log(obj),
      (err) => console.log('err: ', err),
      () => console.log('Done')
    );
  }
}

Gustav.init(ConsoleLoader);