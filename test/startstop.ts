/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

'use strict';

import {gustav} from '../index';
import {addCommonNodes} from './common';

addCommonNodes(gustav);

// TODO: not stupid way of doing this
// i.e. no try/catch or nested setTimeouts
describe('Workflow start/stop', () => {
  it('should be able to start & stop a workflow', (done) => {
    try {
      let simpleWf = gustav.createWorkflow()
        .source('intSource')
        .sink('fromIntSource');

      simpleWf.start();

      setTimeout(() => {
        simpleWf.stop();

        // Run the workflow again
        simpleWf.start();
        setTimeout(() => {
          done();
        }, 15);
      }, 15);
    } catch (e) {
      done(e);
    }
  });
});
