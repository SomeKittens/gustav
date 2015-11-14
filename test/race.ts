/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

'use strict';

import {gustav} from '../index';
import {INodeDef} from '../Workflow';
import {addCommonNodes} from './common';

addCommonNodes(gustav);

// Repro of https://github.com/SomeKittens/gustav/issues/15

// This workflow causes an error when trying to publish
// Note that the source is defined *after* the rest of the nodes
// So Object.getOwnPropertySymbols will return that one *after* other nodes
// And so it'll be the last to be processed by resolveDeps
// http://stackoverflow.com/q/33703252/1216976
let wf: INodeDef[] = [{
  id: 2,
  name: 'timesTwo',
  dataFrom: 1
}, {
  id: 4,
  name: 'fromIntTransformer',
  dataFrom: 2
}, {
  id: 3,
  name: 'fromIntSource',
  dataFrom: 1
}, {
  id: 1,
  name: 'intSource'
}];

describe('Workflow cache race condition', () => {
  it('should not throw on start', () => {
    let a = gustav.makeWorkflow(wf);
    a.start();
  });

  it('should send correct data around', (done) => {
    // Bit of a hack, everything should be through by 10ms in
    setTimeout(done, 10);

    gustav.makeWorkflow(wf).start();
  });
});
