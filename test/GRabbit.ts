'use strict';

import {GustavRabbit} from '../external/GustavRabbit';
import {Observable} from '@reactivex/rxjs';
import {expect} from 'chai';
import {connect} from 'amqplib';
import * as uuid from 'node-uuid';

describe('GustavRabbit', () => {
  // Hacky way of doing integration testing
  let kit = process.env.INTE ? it.bind(it) : it.skip.bind(it);

  let handleErr = err => { if (err) { throw err; }};

  let client, gr, connProm;
  beforeEach(() => {
    connProm = connect('amqp://localhost')
    .then(c => client = c && c.createChannel());
    gr = new GustavRabbit();
  });

  kit('constructs without errors', () => {
    let a = new GustavRabbit();
    expect(a).to.be.ok;
  });

  kit('listens to a rabbitmq exchange', (done) => {
    let recieved = 0;
    let exchange = 'gustavTest-listen';

    let rabbitObservable = gr.from(exchange);

    rabbitObservable.subscribe(item => {
      recieved++;
      expect(item, 'Recieved proper message').to.equal('hello');
      expect(recieved, 'Correct number of runs').to.equal(1);
      done();
    },
    handleErr);

    connProm.then(ch => {
      ch.assertExchange(exchange, 'fanout');
      setTimeout(() => {
        ch.publish(exchange, '', new Buffer('hello'));
      }, 15);
    }).catch(handleErr);
  });

  kit('publishes to a rabbitmq exchange', (done) => {
    let exchange = 'gustavTest-publish';
    let queue = uuid.v4();

    connProm
    .then(ch => {
      ch.assertExchange(exchange, 'fanout', {durable: true});
      ch.assertQueue(queue, {durable: true});

      ch.bindQueue(queue, exchange, '');
      ch.consume(queue, msg => {
        expect(msg.content.toString()).to.equal('hello');
        done();
        ch.ack(msg);
      }, {noAck: false});
    })
    .catch(handleErr);

    let obs = new Observable(o => {
      setTimeout(() => o.next('hello'), 15);
    });

    gr.to(exchange, obs);
  });
});
