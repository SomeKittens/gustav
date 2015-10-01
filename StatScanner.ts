'use strict';

import * as Deque from 'double-ended-queue';

interface EventItem {
  timestamp: number;
}

/**
 * Simple class to mess around with
 * Just records how many hits it's had in the last 30 seconds
 */
export class StatScanner {
  latestBucket: number;
  statsDeque: Deque;
  bucketStart: number;
  constructor(name:string|symbol, public interval:number) {
    this.bucketStart = Date.now();
    this.latestBucket = 0;
    this.statsDeque = new Deque();

    setInterval(() => console.log(name, this.getNumInvocations()), this.interval);
  }
  add() {
    this.latestBucket++;
    if (this.bucketStart < Date.now() - (this.interval / 30)) {
      this.statsDeque.push({
        timestamp: Date.now(),
        count: this.latestBucket
      });
      this.latestBucket = 0;
    }
  }
  getNumInvocations() {
    let eventsLast30 = [];
    let done = false;
    let thirtySecondsAgo = Date.now() - this.interval;
    while (!done) {
      let item = this.statsDeque.pop();
      if (item && item.timestamp > thirtySecondsAgo) {
        eventsLast30.unshift(item);
      } else {
        done = true;
      }
    }
    this.statsDeque = eventsLast30;
    return eventsLast30.length;
  }
}