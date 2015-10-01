/**
 * Runs StatScanner through its paces
 */

import {Stats} from './StatScanner';

let s = new Stats(1000);

let interval = setInterval(() => {
  s.add();
}, 100);

setTimeout(() => {
  console.log('should be 10: ', s.getNumInvocations());
  clearInterval(interval);
}, 1050);

let s0 = new Stats(1500);

let interval0 = setInterval(() => {
  s0.add();
}, 100);

setTimeout(() => {
  console.log('should be 15: ', s0.getNumInvocations());
  console.log('should be 5: ', s.getNumInvocations());
  clearInterval(interval0);
}, 1550);