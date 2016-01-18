'use strict';

import {GustavMem} from '../couplers/GustavMem';
import {Observable} from '@reactivex/rxjs';

import {expect} from 'chai';

describe('GustavMem', () => {
  let gm;
  beforeEach(() => {
    gm = new GustavMem();
  });

  it('constructs without errors', () => {
    let a = new GustavMem();
    expect(a).to.be.ok;
  });

  it('listens to a channel', (done) => {
    let recieved = 0;
    let channel = 'test-0';

    let myObservable = gm.from(channel);

    myObservable.subscribe(item => {
      recieved++;
      expect(item, 'Recieved proper message').to.equal('hello');
      expect(recieved, 'Correct number of runs').to.equal(1);
      done();
    }, err => { throw err; });

    gm.publish(channel, 'hello');
  });

  it('publishes to a channel', (done) => {
    let channel = 'test-1';

    let obs = new Observable(o => {
      setTimeout(() => o.next('hello'), 15);
    });

    gm.subscribe(channel, (message) => {
      expect(message).to.equal('hello');
      done();
    });

    gm.to(channel, obs);

  });
});
