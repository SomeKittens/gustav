/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

'use strict';

import {gustav} from '../index';
import {Workflow} from '../Workflow';
import {expect} from 'chai';
import {addCommonNodes} from './common';

addCommonNodes(gustav);

// Couple of common workflows
describe('Common workflows', () => {
  let wfFactories = [];

  wfFactories.push(function (): Workflow {
    return gustav.createWorkflow('simpleWf')
      .source('intSource')
      .sink('fromIntSource');
  });

  wfFactories.push(function (): Workflow {
    return gustav.createWorkflow('threeWf')
      .source('intSource')
      .transf('timesTwo')
      .sink('fromIntTransformer');
  });

  wfFactories.push(function (): Workflow {
    return gustav.createWorkflow('strWf')
      .source('strSource')
      .transf('important')
      .sink('fromStrTransformer');
  });

  wfFactories.push(function (): Workflow {
    // Multiple paths
    return gustav.createWorkflow('forkWf')
      .source('intSource')
      .tap('fromIntSource')
      .transf('timesTwo')
      .sink('fromIntTransformer');
  });

  wfFactories.push(function (): Workflow {
    // Multiple paths
    let s = gustav.createWorkflow('mergeWf')
      .source('intSource');

    let d = s.transf('timesTwo');
    let h = s.transf('divideByTwo');

    let wf = d
      .merge(h)
      .sink('fromMergedMath');

    return wf;
  });

  // http://stackoverflow.com/a/6640851/1216976
  let uuidReg = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

  wfFactories
  .forEach(factory => {
    describe(`Testing common workflow`, () => {
      let wf;
      beforeEach(() => {
        wf = factory();
        // Silly hacks
        console.log(`      - ${wf.name}`);
      });
      it(`should return a UUID`, () => {
        expect(wf.uuid).to.match(uuidReg);
        wf.start();
      });

      it(`should send correct data around`, (done) => {
        // Bit of a hack, everything should be through by 10ms in
        let time = setTimeout(done, 10);
        try {
          // assertions are in the nodes themselves
          wf.start();
        } catch (e) {
          clearTimeout(time);
          done(e);
        }
      });
    });
  });
});
