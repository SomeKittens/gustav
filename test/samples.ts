/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

'use strict';

import {gustav} from '../index';
import {INodeDef} from '../Workflow';
import {Observable} from '@reactivex/rxjs';
import {expect} from 'chai';
import {addCommonNodes} from './common';

addCommonNodes(gustav);

// Couple of common workflows
let simpleWf:INodeDef[] = [{
  id: 1,
  name: 'intSource'
}, {
  id: 2,
  name: 'fromIntSource',
  dataFrom: 1
}];

let threeWf:INodeDef[] = [{
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

let strWf:INodeDef[] = [{
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
let forkWf:INodeDef[] = [{
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
  describe(`Testing ${def.name} workflow`, () => {
    it(`${def.name} should not throw on start`, () => {
      let a = gustav.makeWorkflow(def.wf);
      a.start();
    });

    it(`${def.name} should send correct data around`, (done) => {
      // Bit of a hack, everything should be through by 10ms in
      let time = setTimeout(done, 10);
      try {
        gustav.makeWorkflow(def.wf).start();
      } catch (e) {
        clearTimeout(time);
        done(e);
      }
    });
  });
});

