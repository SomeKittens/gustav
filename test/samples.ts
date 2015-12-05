/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

'use strict';

import {gustav} from '../index';
import {Workflow} from '../Workflow';
import {expect} from 'chai';
import {addCommonNodes} from './testNodes';

addCommonNodes(gustav);

// Couple of common workflows
describe('Common workflows', () => {
  let wfFactories = [];

  wfFactories.push((done): Workflow => {
    return gustav.createWorkflow('simpleWf')
      .source('intSource')
      .sink('fromIntSource', done);
  });

  wfFactories.push((done): Workflow => {
    return gustav.createWorkflow('threeWf')
      .source('intSource')
      .transf('timesTwo')
      .sink('fromIntTransformer', done);
  });

  wfFactories.push((done): Workflow => {
    return gustav.createWorkflow('strWf')
      .source('strSource')
      .transf('important')
      .sink('fromStrTransformer', done);
  });

  wfFactories.push((done): Workflow => {
    // Multiple paths
    return gustav.createWorkflow('tapWf')
      .source('intSource')
      .tap('fromIntSource', () => {})
      .transf('timesTwo')
      .sink('fromIntTransformer', done);
  });

  wfFactories.push((done): Workflow => {
    // Multiple paths
    let s = gustav.createWorkflow('mergeWf')
      .source('intSource');

    // When we call transf, it'll update the state
    // So we need a copy at this state.
    let s0 = s.clone();

    let d = s.transf('timesTwo');
    let h = s0.transf('divideByTwo');

    let wf = d
      .merge(h)
      .sink('fromMergedMath', done);

    return wf;
  });

  // http://stackoverflow.com/a/6640851/1216976
  let uuidReg = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

  wfFactories
  .forEach(factory => {
    describe(`Testing common workflow`, () => {
      beforeEach(() => {
        let wf = factory();
        // Silly hacks, yes, we're creating an entire workflow to get the name
        console.log(`      - ${wf.name}`);
      });
      it(`should return a UUID`, () => {
        // Give the factory noop for "done"
        let wf = factory();
        expect(wf.uuid).to.match(uuidReg);
      });

      it(`should send correct data around`, (done) => {
        let wf = factory(done);
        try {
          // assertions are in the nodes themselves
          wf.start();
        } catch (e) {
          done(e);
        }
      });
    });
  });
});
