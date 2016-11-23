'use strict';

import {Observable, Subscription} from '@reactivex/rxjs';
import {ICoupler} from '../defs';
import {connect} from 'amqplib';
import * as uuid from 'uuid';

// Untested, use at own risk

// Uses fanout exchanges so we can connect many queues to them
export class GustavRabbit implements ICoupler {
  defaultName: string;
  constructor(public config?: any) {
    this.config = this.config || {
      connString: 'amqp://localhost'
    };
    this.defaultName = 'rabbitmq';
  }

  from(exchange: string): Observable<any> {
    let queue = uuid.v4();
    return new Observable(o => {
      let conn;
      connect(this.config.connString)
      .then(c => conn = c && c.createChannel())
      .then(ch => {
        ch.assertExchange(exchange, 'fanout', {durable: true});
        ch.assertQueue(queue, {durable: true});

        ch.bindQueue(queue, exchange, '');
        ch.consume(queue, msg => {
          let msgStr = msg.content.toString();
          ch.ack(msg);
          if (msgStr === '__done') {
            return o.complete();
          }
          o.next(msgStr);
        }, {noAck: false});
      })
      .catch(err => o.error(err));

      return () => conn && conn.close();
    });
  }

  to(exchange: string, iO: Observable<any>): Subscription<any> {
    let channel, conn, cachedItems = [];
    let queue = uuid.v4();

    connect(this.config.connString)
    .then(c => conn = c && c.createChannel())
    .then(c => {
      channel = c;

      channel.assertExchange(exchange, 'fanout');
      cachedItems.forEach(item => {
        channel.publish(exchange, '', new Buffer(item));
      });
    })
    .catch(err => { throw err; });

    return iO
      .subscribe(
        msg => {
          if (!channel) {
            return cachedItems.push(msg);
          }

          channel.publish(exchange, '', new Buffer(msg));
        },
        err => console.error(`rabbitSink err, queue: ${queue}`, err),
        () => {
          if (conn) {
            channel.publish(exchange, '', new Buffer('__done'));
            conn.close()
          }
        }
      );
  }
}
