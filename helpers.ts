'use strict';

import {gustav} from './index';
import {appendFileSync, writeFileSync} from 'fs';
let Rx = require('@reactivex/rxjs');
let Observable = Rx.Observable;

// TODO: .d.ts for tail
// import {Tail} from 'tail';
var Tail = require('tail').Tail;

export let fileSource = gustav.source('fileSource', (config) => {
  if (typeof config === 'string') { config = { filename: config }; }
  let tailConfig = {
    filename: config.filename,
    lineSeparator: config.lineSeparator || '\n',
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

export let consoleSink = gustav.sink('consoleSink', (prefix='Gustav:') => {
  return (iO) => {
    iO.forEach(console.log.bind(console, prefix), console.log.bind(console, prefix), console.log.bind(console, prefix));
  };
});

export let fileSink = gustav.sink('FileSink', (filename) => {
  return (iO) => {
    // Clear the file
    writeFileSync(filename, '');
    iO.forEach(
      arr => arr.forEach(title => {appendFileSync(filename, title + '\n')}),
      err => console.log('err', err),
      () => {console.log('Finished');appendFileSync(filename, '**done**\n')}
    )
  }
})