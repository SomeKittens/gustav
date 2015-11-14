/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

'use strict';

import {gustav} from '../index';
import {INodeDef, Workflow} from '../Workflow';
import {addCommonNodes} from './common';

addCommonNodes(gustav);

// Couple of common workflows
let simpleWf: INodeDef[] = [{
  id: 1,
  name: 'intSource'
}, {
  id: 2,
  name: 'fromIntSource',
  dataFrom: 1
}];

// TODO: not stupid way of doing this
describe('Workflow start/stop', () => {
  it('should be able to start & stop a workflow', (done) => {
    try {
      let wf: Workflow = gustav.makeWorkflow(simpleWf);
      wf.start();
      setTimeout(() => {
        wf.stop();
        wf.start();
        setTimeout(() => {
          done();
        }, 15);
      }, 15);
    } catch (e) {
      done(e);
    }
  });
});
