'use strict';

import {Observable, Subscription} from '@reactivex/rxjs';
import {IExternalClient} from '../defs';

/**
 * GustavMem is an in-memory messaging system.  It provides NO GUARANTEES about anything.
 * Use at your own risk!
 *
 * Mainly this is used for tests.
 */

export class GustavMem implements IExternalClient {
  channels: Object;
  constructor() {
    this.channels = {};
  };

  from(channelName: string): Observable<any> {
    this.initChannel(channelName);
    return new Observable(o => {
      this.channels[channelName].push(item => {
        if (item === '__done') {
          return o.complete();
        }
        o.next(item);
      });
    });
  }
  to(channelName: string, iO: Observable<any>): Subscription<any> {
    this.initChannel(channelName);

    return iO.subscribe(
      item => this.channels[channelName].forEach(fn => fn(item)),
      err => { throw err; },
      () => this.channels[channelName].forEach(fn => fn('__done'))
    );
  }

  // Testing
  publish(channelName, item, cb?): void {
    this.initChannel(channelName);
    this.channels[channelName].forEach(fn => fn(item));
    if (cb) { cb(); }
  }
  subscribe(channelName, fn): void {
    this.initChannel(channelName);
    this.channels[channelName].push(fn);
  }

  private initChannel (name: string): void {
    if (this.channels[name]) { return; }
    this.channels[name] = [];
  }
}
