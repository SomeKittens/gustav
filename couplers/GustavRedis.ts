'use strict';

import {createClient, RedisClient} from 'redis';
import {Observable, Subscription} from '@reactivex/rxjs';
import {ICoupler} from '../defs';

// Provides helpers for getting data from & to Redis event channels
export class GustavRedis implements ICoupler {
  defaultName: string;
  constructor(public config?: any) {
    this.defaultName = 'redis';
  }

  // supposedly private but needs to be overridden in tests
  getClient(): RedisClient {
    // Need to create a new client for every connection
    return createClient(this.config);
  }

  // two methods, one called on from, other on to
  from(channelName: string): Observable<any> {
    let client = this.getClient();
    return new Observable(o => {
      client.on('message', (channel, message) => {
        if (message === '__done') {
          return o.complete();
        }
        o.next(message);
      });
      client.subscribe(channelName);

      return () => client.unsubscribe(channelName);
    });
  }
  to(channelName: string, iO: Observable<any>): Subscription<any> {
    let client = this.getClient();
    return iO.subscribe(
      item => client.publish(channelName, item),
      err => { throw err; },
      () => client.publish(channelName, '__done')
    );
  }
}
