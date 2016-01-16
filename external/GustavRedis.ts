'use strict';

import {gustav} from '../index';
import {createClient} from 'redis';
import {Observable, Subscription} from '@reactivex/rxjs';

// Attach to a Gustav instance

// Provides helpers for getting data from & to Redis event channels
export class GustavRedis {
  constructor(public config?) {}

  // two methods, one called on from, other on to
  from(channelName: string): Observable<any> {
    let client = createClient(this.config);
    return new Observable(o => {
      client.on('message', (channel, message) => {
        o.next(message);
      });
      client.subscribe(channelName);

      return () => client.unsubscribe(channelName);
    });
  }
  to(channelName: string, iO: Observable<any>): Subscription<any> {
    let client = createClient(this.config);
    return iO.subscribe(
      item => client.publish(channelName, item)
    );
  }
}