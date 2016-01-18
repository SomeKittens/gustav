'use strict';

import {GustavRedis} from '../couplers/GustavRedis';
import {Observable} from '@reactivex/rxjs';

import {expect} from 'chai';

class MockClient {
  listeners: any[];
  channels: any[];
  constructor() {
    this.channels = [];
    this.listeners = [];
  }
  publish(channel: string, item: string, fn?): void {
    if (this.channels.indexOf(channel) > -1) {
      this.listeners.forEach(listener => listener(channel, item));
    }
    if (fn) { fn(null, channel); }
  }
  on(message: string, fn): void {
    this.listeners.push(fn);
  }
  subscribe(channel: string, fn?): void {
    this.channels.push(channel);
    if (fn) { fn(); }
  }
}

describe('GustavRedis', () => {
  let client, gr;
  beforeEach(() => {
    client = new MockClient();
    gr = new GustavRedis();
    gr.getClient = () => client;
  });

  it('constructs without errors', () => {
    let a = new GustavRedis();
    expect(a).to.be.ok;
  });

  it('listens to a redis channel', (done) => {
    let recieved = 0;
    let channel = 'test-0';

    let redisObservable = gr.from(channel);

    redisObservable.subscribe(item => {
      recieved++;
      expect(item, 'Recieved proper message').to.equal('hello');
      expect(recieved, 'Correct number of runs').to.equal(1);
      done();
    }, err => { throw err; });

    // TODO: Why is GR's subscribe happening after this publish
    // when run sync?
    setTimeout(() => {
      client.publish(channel, 'hello', (err) => {
        if (err) { throw err; }
      });
    }, 15);
  });

  it('publishes to a redis channel', (done) => {
    let channel = 'test-1';

    let obs = new Observable(o => {
      setTimeout(() => o.next('hello'), 15);
    });

    gr.to(channel, obs);

    client.on('message', (channelIn, message) => {
      expect(channelIn).to.equal(channel);
      expect(message).to.equal('hello');
      done();
    });
    client.subscribe(channel);
  });

  // Might not be needed now that we don't share clients
  it.skip('listens to only one redis channel', (done) => {
    let recieved = 0;
    let channel = 'test-1';
    let otherChannel = 'test-other';

    let redisObservable = gr.from(channel);
    let redObs2 = gr.from(otherChannel);

    redisObservable.subscribe(item => {
      throw 'Unexpected subscribe call';
    }, err => { throw err; });

    redObs2.subscribe(item => {
      recieved++;
    }, err => { throw err; });

    // TODO: Why is GR's subscribe happening after this publish
    // when run sync?
    setTimeout(() => {
      client.publish(otherChannel, 'hello', (err) => {
        if (err) { throw err; }
        expect(recieved, 'Correct number of runs').to.equal(1);
        done();
      });
    }, 15);
  });
});
