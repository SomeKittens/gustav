/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

'use strict';

import {gustav} from '../index';
import {addCommonNodes} from './testNodes';

addCommonNodes(gustav);

// TODO: not stupid way of doing this
// i.e. no try/catch
describe('Workflow start/stop', () => {
  it('should be able to start & stop a workflow', (done) => {
    try {
      let firstRun = true;
      let simpleWf = gustav.createWorkflow()
        .source('intSource')
        .sink('fromIntSource', () => {
          if (firstRun) {
            firstRun = false;
            simpleWf.stop();
            // Run the workflow again
            simpleWf.start();
          } else {
            done();
          }
        });

      simpleWf.start();

    } catch (e) {
      done(e);
    }
  });
});
