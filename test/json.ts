'use strict';

import {gustav} from '../index';
import {INodeDef} from '../defs';
import {expect} from 'chai';
import {addCommonNodes} from './testNodes';

describe(`Workflow's .fromJSON()`, () => {
  beforeEach(() => {
    gustav.reset();
    addCommonNodes(gustav);
  });
  let noop = (): void => {};
  let simpleWf = (done): INodeDef[] => [{
    id: 1,
    name: 'intSource'
  }, {
    id: 2,
    name: 'fromIntSource',
    dataFrom: 1,
    config: done
  }];

  let threeWf = (done): INodeDef[] => ([{
    id: 1,
    name: 'intSource'
  }, {
    id: 2,
    name: 'timesTwo',
    dataFrom: 1
  }, {
    id: 3,
    name: 'fromIntTransformer',
    dataFrom: 2,
    config: done
  }]);

  let strWf = (done): INodeDef[] => ([{
    id: 1,
    name: 'strSource'
  }, {
    id: 2,
    name: 'important',
    dataFrom: 1
  }, {
    id: 3,
    name: 'fromStrTransformer',
    dataFrom: 2,
    config: done
  }]);

  // Multiple paths
  let forkWf = (done): INodeDef[] => ([{
    id: 1,
    name: 'intSource'
  }, {
    id: 2,
    name: 'timesTwo',
    dataFrom: 1
  }, {
    id: 3,
    name: 'fromIntSource',
    dataFrom: 1,
    config: noop
  }, {
    id: 4,
    name: 'fromIntTransformer',
    dataFrom: 2,
    config: done
  }]);


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
    it(`${def.name} should return a UUID`, (done) => {
      let a = gustav.createWorkflow().fromJSON(def.wf(done));
      expect(a.uuid).to.match(uuidReg);
      a.start();
    });

    it(`${def.name} should send correct data around`, (done) => {
      try {
        gustav.createWorkflow().fromJSON(def.wf(done)).start();
      } catch (e) {
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
    let wfRace = (done): INodeDef[] => [{
      id: 2,
      name: 'timesTwo',
      dataFrom: 1
    }, {
      id: 4,
      name: 'fromIntTransformer',
      dataFrom: 2,
      config: noop
    }, {
      id: 3,
      name: 'fromIntSource',
      dataFrom: 1,
      config: done
    }, {
      id: 1,
      name: 'intSource'
    }];

    it('should send correct data around', (done) => {
      let wf = gustav.createWorkflow().fromJSON(wfRace(done));

      // Error will be thrown on start
      wf.start();
    });
  });

  it('should error when calling toJSON on a non-empty workflow', () => {
    let wf = gustav.createWorkflow()
      .source('intSource')
      .sink('fromIntSource');

    function err(): void {
      wf.fromJSON(forkWf(() => {}));
    }

    expect(err).to.throw(Error);
  });
});

describe('Workflow\'s .toJSON', () => {
  it('should convert a simple workflow into JSON', () => {
    let noop = () => {};
    let wf = gustav.createWorkflow()
      .source('intSource')
      .sink('fromIntSource', noop);

    let wfJSON = [
      {
        id: 1,
        name: 'intSource',
        type: 'source'
      },
      {
        config: noop,
        dataFrom: [1],
        id: 0,
        name: 'fromIntSource',
        type: 'sink'
      }
    ];

    expect(wf.toJSON()).to.deep.equal(wfJSON);
  });

  it('should convert a complex workflow into JSON', () => {
    let noop = () => {};
    let wf = gustav.createWorkflow('tapWf')
      .source('intSource')
      .tap('fromIntSource', noop)
      .transf('timesTwo')
      .sink('fromIntTransformer', noop);

    let wfJSON = [{
      id: 1,
      name: 'intSource',
      type: 'source'
    }, {
      id: 0,
      name: 'fromIntSource',
      dataFrom: [1],
      config: noop,
      type: 'sink'
    }, {
      id: 3,
      name: 'timesTwo',
      dataFrom: [1],
      type: 'transformer'
    }, {
      id: 2,
      name: 'fromIntTransformer',
      dataFrom: [3],
      config: noop,
      type: 'sink'
    }];

    expect(wf.toJSON()).to.deep.equal(wfJSON);
  });
});

describe(`all JSON together now, y'hear?`, () => {
  it('should go full circle', () => {
    let noop = () => {};
    let wfJSON = [
      {
        id: 1,
        name: 'intSource',
        type: 'source'
      },
      {
        config: noop,
        dataFrom: [1],
        id: 0,
        name: 'fromIntSource',
        type: 'sink'
      }
    ];
    let wf = gustav.createWorkflow().fromJSON(wfJSON).toJSON();

    expect(wf).to.deep.equal(wfJSON);
  });
});
