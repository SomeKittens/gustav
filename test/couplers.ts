'use strict';

import {gustav} from '../index';
import {Workflow} from '../Workflow';
import {GustavMem} from '../couplers/GustavMem';
import {addCommonNodes} from './testNodes';


describe('gustav.coupler', () => {
  let gm;
  beforeEach(() => {
    gustav.reset();
    addCommonNodes(gustav);
    gm = new GustavMem();
  });
  let wfFactories = [];
  wfFactories.push((done): Workflow => {
    return gustav.createWorkflow('ex-0')
      .source('intSource')
      .to('mem', 'bill');
  });

  wfFactories.push((done): Workflow => {
    return gustav.createWorkflow('ex-1')
      .from('mem', 'bill')
      .transf('timesTwo')
      .sink('fromIntTransformer', done);
  });

  wfFactories.push((): Workflow => {
    return gustav.createWorkflow('ex-2')
      .from('mem', 'bill')
      .transf('timesTwo')
      .to('mem2', 'bob');
  });

  wfFactories.push((done): Workflow => {
    return gustav.createWorkflow('ex-3')
      .from('mem2', 'bob')
      .sink('fromIntTransformer', done);
  });

  it('allows for multiple workflows', (done) => {
    gustav.coupler(gm, 'mem');

    wfFactories[1](done).start();
    wfFactories[0]().start();
  });

  it('accepts a default name', (done) => {
    gustav.coupler(gm);

    wfFactories[1](done).start();
    wfFactories[0]().start();
  });

  it('allows for multiple couplers', done => {
    gustav.coupler(gm);
    gustav.coupler(new GustavMem(), 'mem2');

    wfFactories[3](done).start();
    wfFactories[2]().start();
    wfFactories[0]().start();
  });

  it('allows for forking workflows', done => {
    gustav.coupler(gm, 'mem');
    let inProgress = 3;

    let partDone = () => {
      inProgress--;
      if (!inProgress) {
        done();
      }
    };

    wfFactories[1](partDone).start();
    wfFactories[1](partDone).start();
    wfFactories[1](partDone).start();
    wfFactories[0]().start();
  });
});
