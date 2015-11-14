/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

'use strict';

import {gustav} from '../index';
import {INodeDef} from '../Workflow';
import {expect} from 'chai';
import {addCommonNodes} from './common';

addCommonNodes(gustav);
describe(`Workflow's .fromJSON()`, () => {

  let simpleWf: INodeDef[] = [{
    id: 1,
    name: 'intSource'
  }, {
    id: 2,
    name: 'fromIntSource',
    dataFrom: 1
  }];

  let threeWf: INodeDef[] = [{
    id: 1,
    name: 'intSource'
  }, {
    id: 2,
    name: 'timesTwo',
    dataFrom: 1
  }, {
    id: 3,
    name: 'fromIntTransformer',
    dataFrom: 2
  }];

  let strWf: INodeDef[] = [{
    id: 1,
    name: 'strSource'
  }, {
    id: 2,
    name: 'important',
    dataFrom: 1
  }, {
    id: 3,
    name: 'fromStrTransformer',
    dataFrom: 2
  }];


  // Multiple paths
  let forkWf: INodeDef[] = [{
    id: 1,
    name: 'intSource'
  }, {
    id: 2,
    name: 'timesTwo',
    dataFrom: 1
  }, {
    id: 3,
    name: 'fromIntSource',
    dataFrom: 1
  }, {
    id: 4,
    name: 'fromIntTransformer',
    dataFrom: 2
  }];


  // http://stackoverflow.com/a/6640851/1216976
  let uuidReg = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

  [{
    name: 'simpleWf',
    wf: simpleWf
  }, {
    name: 'threeWf',
    wf: threeWf
  }, {
    name: 'strWf',
    wf: strWf
  }, {
    name: 'forkWf',
    wf: forkWf
  }]
  .forEach(def => {
    it(`${def.name} should return a UUID`, () => {
      let a = gustav.createWorkflow().fromJSON(def.wf);
      expect(a.uuid).to.match(uuidReg);
      a.start();
    });

    it(`${def.name} should send correct data around`, (done) => {
      // Bit of a hack, everything should be through by 10ms in
      let time = setTimeout(done, 10);
      try {
        gustav.createWorkflow().fromJSON(def.wf).start();
      } catch (e) {
        clearTimeout(time);
        done(e);
      }
    });
  });

  it('should not care what order things are in', () => {
    // Repro of https://github.com/SomeKittens/gustav/issues/15

    // This workflow causes an error when trying to publish
    // Note that the source is defined *after* the rest of the nodes
    // So Object.getOwnPropertySymbols will return that one *after* other nodes
    // And so it'll be the last to be processed by resolveDeps
    // http://stackoverflow.com/q/33703252/1216976
    let wfRace: INodeDef[] = [{
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

    it('should send correct data around', (done) => {
      // Bit of a hack, everything should be through by 10ms in
      setTimeout(done, 10);

      let wf = gustav.createWorkflow().fromJSON(wfRace);

      // Error will be thrown on start
      wf.start();
    });
  });

  it('should error when calling toJSON on a non-empty workflow', () => {
    let wf = gustav.createWorkflow()
      .source('intSource')
      .sink('fromIntSource');

    function err(): void {
      wf.fromJSON(forkWf);
    }

    expect(err).to.throw(Error);
  });
});
