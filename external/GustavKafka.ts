'use strict';

import {Observable, Subscription} from '@reactivex/rxjs';
import {IExternalClient} from '../defs';

// No definitions for kafka, sad
let kafka = require('kafka-node');

export interface IConsumerConfig {
  partition?: any;
  offset?: any;
}

export class GustavKafka implements IExternalClient {
  constructor(public config?: any) {
    this.config = this.config || {
      connString: 'localhost:2181',
      clientId: 'kafka-gustav-client'
    };
  }

  getClient(): any {
    return new kafka.Client(this.config.connString, this.config.clientId);
  }

  // two methods, one called on from, other on to
  from(topic: string, offset?: number): Observable<any> {
    let client = this.getClient();

    let consumer = new kafka.Consumer(client, [{
      topic
    }]/* TODO */);

    return new Observable(o => {
      consumer.on('message', m => o.next(m.value));
      consumer.on('error', err => o.error(err));

      return () => consumer.close(() => {});
    });
  }
  to(topic: string, iO: Observable<any>): Subscription<any> {
    let client = this.getClient();
    let producer = new kafka.Producer(client);

    let buffer = [];
    let handleErr = err =>  {
      if (err) { throw err; }
    };

    producer.on('ready', () => {
      if (!buffer.length) { return; }
      producer.send([{
        topic: topic,
        messages: buffer
      }], handleErr);
    });

    return iO
    // Things run faster overall with a little buffering
    .bufferTime(50)
    .subscribe(
      msg => {
        if (!msg.length) { return; }

        for (let i = msg.length - 1; i >= 0; i--) {
          msg[i] = typeof msg[i] === 'string' ? msg[i] : JSON.stringify(msg[i]);
        }

        if (!producer.ready) {
          buffer = buffer.concat(msg);
          return;
        }

        producer.send([{
          topic: topic,
          messages: msg
        }], handleErr);
      },
      handleErr,
      () => {/* noop */}// client.close(console.log.bind(console, 'done', config.topic))
    );
  }
}
