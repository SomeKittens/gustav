'use strict';

import {Observable} from '@reactivex/rxjs';
import {expect} from 'chai';


/**
 * Nodes common to all test workflows
 */
export let addCommonNodes = gustav => {

  // Used by several nodes
  let words = ['hello', 'world', 'gustav', 'is', 'neat'];

  gustav.source('intSource', () => {
    return Observable.interval(1).take(5);
  });

  gustav.source('strSource', () => {
    return Observable
      .interval(1)
      .take(5)
      .map(int => words[<number>int]);
  });

  gustav.transformer('timesTwo', iO => iO.map(item => item * 2));
  gustav.transformer('divideByTwo', iO => iO.map(item => item / 2));

  gustav.transformer('important', iO => iO.map(word => word + '!'));

  gustav.sink('fromIntSource', (onFinished, iO) => {
    let nextNum = 0;
    return iO.subscribe(
      num => {
        expect(num, 'fromIntSource next').to.equal(nextNum++);
      },
      err => {
        throw err;
      },
      () => {
        expect(nextNum, 'fromIntSource complete').to.equal(5);
        onFinished();
      }
    );
  });

  gustav.sink('fromIntTransformer', (onFinished, iO) => {
    let idx = 0;
    let lastNum;
    return iO.subscribe(
      num => {
        lastNum = num;
        expect(num, 'fromTransformer next').to.equal(idx * 2);
        idx++;
      },
      err => {
        throw err;
      },
      () => {
        expect(lastNum, 'fromTransformer complete lastNum').to.equal(8);
        expect(idx, 'fromTransformer complete idx').to.equal(5);
        onFinished();
      }
    );
  });

  gustav.sink('fromStrTransformer', (onFinished, iO) => {
    let idx = 0;
    return iO.subscribe(
      word => {
        expect(word, 'fromStrTransformer next').to.equal(words[idx] + '!');
        idx++;
      },
      err => {
        throw err;
      },
      () => {
        expect(idx, 'fromStrTransformer complete').to.equal(5);
        onFinished();
      }
    );
  });

  gustav.sink('fromMergedMath', (onFinished, iO) => {
    let idx = 0;
    let expected = [0, 2, 4, 6, 8, 0.5, 1, 1.5];
    return iO.subscribe(
      num => {
        expect(expected, 'fromMergedMath next').to.contain(num);
        idx++;
      },
      err => {
        throw err;
      },
      () => {
        expect(idx, 'fromMergedMath complete').to.equal(10);
        onFinished();
      }
    );
  });
};
