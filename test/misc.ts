'use strict';

import {gustav} from '../index';
import {expect} from 'chai';
import {addCommonNodes} from './testNodes';

addCommonNodes(gustav);

describe('Adding a custom id to a node', () => {
  it('should allow the user to add a custom id', () => {
    let wf = gustav.createWorkflow('gid test')
      .source('intSource', null, {gid: 'hello'})
      .sink('fromIntSource', () => {}, {gid: 'bye'});


    // Simple way to get the nodes themselves
    expect(wf.ggraph.sinkEdges[0].to.toString()).to.equal('Symbol(intSource-hello)');
    expect(wf.ggraph.sinkEdges[0].from.toString()).to.equal('Symbol(fromIntSource-bye)');
  });
});

describe('Workflows have name even when one is not passed in', () => {
  before(() => gustav.reset());

  it('assigns a name to a workflow', () => {
    let wf = gustav.createWorkflow();
    expect(wf.name).to.equal('Unnamed Workflow 0');
  });

  it('increments the number in the name', () => {
    let wf = gustav.createWorkflow();
    expect(wf.name).to.equal('Unnamed Workflow 1');
  });
});
