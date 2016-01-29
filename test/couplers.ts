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
      .to('redis', 'bill');
  });

  wfFactories.push((done): Workflow => {
    return gustav.createWorkflow('ex-1')
      .from('redis', 'bill')
      .transf('timesTwo')
      .sink('fromIntTransformer', done);
  });

  it('allows for multiple workflows', (done) => {
    gustav.coupler(gm, 'redis');

    wfFactories[1](done).start();
    wfFactories[0]().start();
  });

  it('allows for forking workflows', done => {
    gustav.coupler(gm, 'redis');
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
