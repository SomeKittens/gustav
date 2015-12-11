'use strict';

import {GustavGraph} from './GustavGraph';
import {Workflow} from './Workflow';

export interface INodeFactory {
  (...config: any[]): symbol;
}

export interface INodeCollection {
  source: string[];
  transformer: string[];
  sink: string[];
}

export interface IRegisteredNode {
  name: string;
  type: string;
  factory: Function;
}

let registeredNodes: IRegisteredNode[] = [];
let workflows = {};
let register;

export let gustav = {
  makeNode: (nodeName: string, graph: GustavGraph, config: any): symbol => {
    let node = registeredNodes.filter((regNode) => regNode.name === nodeName)[0];

    if (!node) {
      throw new Error(nodeName + ' not registered');
    }

    // Attempt to detect config to make symbol tag more descriptive
    let symbolTag = node.name;
    if (config && config.__gid) {
      symbolTag += '-' + config.__gid;
    }
    let sym = Symbol(symbolTag);
    graph.nodes[sym] = {
      type: node.type,
      config: config, // Storing config here for later toJSON calls
      init: config ? node.factory.bind(null, config) : node.factory
    };
    return sym;
  },
  /**
   * Create an empty workflow to be chained off of
   * @param {string} uuid [description]
   */
  createWorkflow (name?: string): Workflow {
    let wf = new Workflow(name);
    workflows[wf.uuid] = wf;
    return wf;
  },
  start: (uuid: string): void => {
    workflows[uuid].start();
  },
  stop: (uuid: string): void => {
    workflows[uuid].stop();
  },
  getNodeTypes: (): INodeCollection => {
    return registeredNodes.reduce((obj, node) => {
      obj[node.type].push(node.name);
      return obj;
    }, {source: [], transformer: [], sink: []});
  },
  source(name: string, factory: Function): Function { return register('source', name, factory); },
  transformer(name: string, factory: Function): Function { return register('transformer', name, factory); },
  sink(name: string, factory: Function): Function { return register('sink', name, factory); },
};

// TODO: new type of registration that's just a singleton
// Just calls INodeFactory and returns the symbol
register = (type: string, name: string, factory): INodeFactory => {
  if (!name) {
    throw new Error('Attempted to register a node without providing a name');
  }
  if (!factory) {
    throw new Error(`Attempted to register node ${name} without providing a factory`);
  }

  // Names must be unique
  const exists = registeredNodes.filter((regNode) => regNode.name === name);
  if (exists.length) {
    throw new Error(`${name} already registered`);
  }
  registeredNodes.push({
    type,
    name,
    factory
  });

  return gustav.makeNode.bind(null, name);
};

// Meta nodes
gustav.transformer('__gmergeNode', (nodes, iO) => {
  return iO.do(() => {});
});
