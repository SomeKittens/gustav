'use strict';

import {gustav} from '../index';
import {Observable} from '@reactivex/rxjs';
import {expect} from 'chai';


describe('passing in node functions directly', () => {
  it('should let us skip registration', (done) => {
    let makeNums = () => new Observable(o => {
      o.next(17);
      o.complete();
    });
    let myFun = iO => iO.map(num => num * 2);
    let expectSink = iO => iO.subscribe(
      num => expect(num).to.equal(34),
      done,
      done
    );

    let wf = gustav.createWorkflow('dummy')
      .source(makeNums)
      .transf(myFun)
      .sink(expectSink);

    wf.start();
  });
});
