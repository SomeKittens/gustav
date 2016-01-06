'use strict';

import {gustav} from '../index';
import {addCommonNodes} from './testNodes';
import {expect} from 'chai';

addCommonNodes(gustav);

describe('FullGraph of multiple workflows', () => {
  it('should create a full graph, including external nodes', () => {
    gustav.reset();
    gustav.createWorkflow('wf1')
      .source('intSource', undefined, {
        external: 'bill'
      })
      .sink('fromIntSource', () => {});

    gustav.createWorkflow('wf2')
      .source('intSource')
      .sink('fromIntSource', () => {}, {
        external: 'bill'
      });

    let expectedGraph = {
      nodes: [
        { type: 'workflow', id: 0, name: 'wf1' },
        { type: 'external', id: 1, name: 'bill' },
        { type: 'workflow', id: 2, name: 'wf2' }
      ],
      links: [
        { source: 1, target: 0 },
        { source: 2, target: 1 }
      ]
    };

    expect(gustav.makeGraph()).to.deep.equal(expectedGraph);
  });
});
