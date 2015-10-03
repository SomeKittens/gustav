'use strict';

// Require so we can point to the compiled version in dist
let gustav = require('../dist/index').gustav;
let Rx = require('@reactivex/rxjs');
let Observable = Rx.Observable;

export let logGenerator = gustav.source('logGenerator', (options) => {
  return () => {
    return new Observable(o => {
      const urls = ['/', '/user', '/pricing', '/admin'];

      const statuses = [200, 200, 200, 200, 200, 200, 200, 200, 200, 400, 400, 400, 404, 404, 404, 500, 500, 500];

      let writeToLogs = () => {
        let url = urls[Math.floor(Math.random() * 4)];
        let status = statuses[Math.floor(Math.random() * statuses.length)];
        o.next(url + ' ' + status);
      }

      let interval = setInterval(writeToLogs, 100);
      return () => {
        clearInterval(interval);
      };
    });
  };
});

export let numberGen = gustav.source('numberGen', (interval=150) => {
  return () => {
    return Observable.interval(interval);
  };
});

export let logParser = gustav.transformer('logParser', () => {
  return (iO) => {
    console.log(iO);
    return iO.map(logLine => {
      let arr = logLine.split(' ');
      return {
        status: arr[1],
        url: arr[0]
      };
    });
  }
});

export let times = gustav.transformer('times', (mulitplier=2) => {
  return (iO) => {
    return iO.map(num => num * mulitplier);
  };
});

export let square = gustav.transformer('square', () => {
  return (iO) => {
    return iO.map(num => num * num);
  };
});

export let consoleSink = gustav.sink('consoleSink', (prefix='Gustav') => {
  return (iO) => {
    iO.forEach(console.log.bind(console, prefix), console.log.bind(console, prefix), console.log.bind(console, prefix));
  };
});