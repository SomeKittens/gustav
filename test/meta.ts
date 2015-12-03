/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

'use strict';

import {gustav} from '../index';
import {addCommonNodes} from './common';
import {expect} from 'chai';

addCommonNodes(gustav);

// TODO: not stupid way of doing this
// i.e. no try/catch or nested setTimeouts
describe('Node metadata', () => {

  it('should be able to attach a metadata watcher', (done) => {
    try {
      let i = 0;
      let simpleWf = gustav.createWorkflow()
        .source('intSource')
        .sink('fromIntSource');

      simpleWf.addMetadataFunction(nodeName => {
        expect(nodeName, 'metadataFunc nodeName').to.equal('intSource');
        return datum => {
          expect(datum, 'metadataFunc datum').to.equal(i);
          i++;
        };
      });

      simpleWf.start();

      setTimeout(() => {
        expect(i, 'metadataFunc was run five times').to.equal(5);
        simpleWf.stop();
        done();
      }, 15);
    } catch (e) {
      done(e);
    }
  });
});
