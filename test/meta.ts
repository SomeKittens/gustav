'use strict';

import {gustav} from '../index';
import {addCommonNodes} from './testNodes';
import {expect} from 'chai';

addCommonNodes(gustav);

// TODO: not stupid way of doing this
// i.e. no try/catch
describe('Node metadata', () => {

  it('should be able to attach a metadata watcher', (done) => {
    try {
      let i = 0;
      let simpleWf = gustav.createWorkflow()
        .source('intSource')
        .sink('fromIntSource', () => {
          expect(i, 'metadataFunc was run five times').to.equal(5);
          done();
        });

      simpleWf.addMetadataFunction(nodeName => {
        expect(nodeName, 'metadataFunc nodeName').to.equal('intSource');
        return datum => {
          expect(datum, 'metadataFunc datum').to.equal(i);
          i++;
        };
      });

      simpleWf.start();
    } catch (e) {
      done(e);
    }
  });
});
