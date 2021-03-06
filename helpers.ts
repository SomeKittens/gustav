'use strict';

import {gustav} from './index';
import {appendFileSync, writeFileSync} from 'fs';
import {Observable} from '@reactivex/rxjs';

// TODO: .d.ts for tail
// import {Tail} from 'tail';
let Tail = require('tail').Tail;

export let fileSource = gustav.source('fileSource', (config) => {
  if (typeof config === 'string') { config = { filename: config }; }
  let tailConfig = {
    filename: config.filename,
    lineSeparator: config.lineSeparator || /[\r]{0,1}\n/,
    watchOptions: config.watchOptions || {},
    fromStart: config.fromStart || false
  };
  return () => {
    let logTail = new Tail(
      tailConfig.filename,
      tailConfig.lineSeparator,
      tailConfig.watchOptions,
      tailConfig.fromStart
    );
    return new Observable(o => {
      logTail.on('line', (line) => o.next(line));
      logTail.on('err', (err) => o.error(err));
      logTail.on('end', () => o.complete());
    });
  };
});

export let consoleSink = gustav.sink('consoleSink', (prefix = 'Gustav:') => {
  return (iO) => {
    iO.subscribe(console.log.bind(console, prefix), console.log.bind(console, prefix), console.log.bind(console, prefix));
  };
});

export let fileSink = gustav.sink('FileSink', (filename) => {
  return (iO) => {
    // Clear the file
    writeFileSync(filename, '');
    iO.subscribe(
      arr => arr.forEach(title => appendFileSync(filename, title + '\n')),
      err => console.log('err', err),
      () => appendFileSync(filename, '**done**\n')
    );
  };
});

let noop = () => {};
export let nullSink = gustav.sink('nullSink', () => {
  return (iO) => {
    iO.subscribe(noop, (err) => console.log('err', err), noop);
  };
});
