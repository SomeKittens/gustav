/// <reference path="../../index.ts" />
/// <reference path="../../typings/tsd.d.ts" />

'use strict';

// Trigger writing to the logs
require('./genLogs');

import Gustav from '../../index';
import {FileSource, LogSink} from '../../helpers';

import {Observable} from 'rx';

class HTTPFileSource extends FileSource {
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

class ConsoleSink extends LogSink {
  static dependencies = HTTPSplitter;
  constructor() {
    super('File Logs');
  }
}

Gustav.init(ConsoleSink);