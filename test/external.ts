'use strict';

import {gustav} from '../index';
import {Workflow} from '../Workflow';
import {GustavMem} from '../external/GustavMem';
import {addCommonNodes} from './testNodes';


describe('gustav.external', () => {
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
      .to('bill');
  });

  wfFactories.push((done): Workflow => {
    return gustav.createWorkflow('ex-1')
      .from('bill')
      .transf('timesTwo')
      .sink('fromIntTransformer', done);
  });

  it('allows for multiple workflows', (done) => {
    gustav.external(gm);

    wfFactories[1](done).start();
    wfFactories[0]().start();
  });

  it('allows for forking workflows', done => {
    gustav.external(gm);
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
