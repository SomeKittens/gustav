'use strict';

import {GustavKafka} from '../external/GustavKafka';
import {Observable} from '@reactivex/rxjs';
import {expect} from 'chai';

let kafka = require('kafka-node');

describe('GustavKafka', () => {
  // Hacky way of doing integration testing
  let kit = process.env.INTE ? it.bind(it) : it.skip.bind(it);

  let handleErr = err => { if (err) { throw err; }};

  let client, gr;
  beforeEach(() => {
    client = new kafka.Client('localhost:2181');
    gr = new GustavKafka();
  });

  kit('constructs without errors', () => {
    let a = new GustavKafka();
    expect(a).to.be.ok;
  });

  kit('listens to a kafka topic', (done) => {
    let recieved = 0;
    let topic = 'gustavTest-listen';

    let producer = new kafka.Producer(client);

    producer.on('ready', () => {
      producer.send([{
        topic,
        messages: ['hello']
      }], handleErr);
    });

    producer.on('err', handleErr);

    let kafObservable = gr.from(topic);

    kafObservable.subscribe(item => {
      recieved++;
      expect(item, 'Recieved proper message').to.equal('hello');
      expect(recieved, 'Correct number of runs').to.equal(1);
      done();
    },
    handleErr);
  });

  kit('publishes to a kafka topic', (done) => {
    let topic = 'gustavTest-publish';

    let consumer = new kafka.Consumer(client, [{
      topic
    }]);

    let obs = new Observable(o => {
      setTimeout(() => o.next('hello'), 15);
    });

    gr.to(topic, obs);

    consumer.on('message', (message) => {
      expect(message.value).to.equal('hello');
      done();
    });
  });
});
