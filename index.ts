/// <reference path="typings/tsd.d.ts" />
/// <reference path="Symbol.d.ts" />
/// <reference path="Promise.d.ts" />

'use strict';

import {GustavGraph} from './GustavGraph';
import {Workflow} from './Workflow';

interface INodeFactory {
  (...config: any[]): symbol;
}

interface INodeCollection {
  source: string[];
  transformer: string[];
  sink: string[];
}

interface IRegisteredNode {
  name: string;
  type: string;
  factory: Function;
}

interface IConfig {
  id?: any;
}

class Gustav {
  registeredNodes: IRegisteredNode[];
  workflows: any;
  constructor() {
    this.registeredNodes = [];
    this.workflows = {};
  }
  makeNode (nodeName: string, graph: GustavGraph, config: IConfig): symbol {
    let node = this.registeredNodes.filter((regNode) => regNode.name === nodeName)[0];

    if (!node) {
      throw new Error(nodeName + ' not registered');
    }

    // Attempt to detect config to make symbol tag more descriptive
    let symbolTag = node.name;
    if (config && config.id) {
      symbolTag += '-' + config[0].__gid;
    }
    let sym = Symbol(symbolTag);
    graph.nodes[sym] = {
      type: node.type,
      init: config ? node.factory.bind(null, config) : node.factory
    };
    return sym;
  }
  makeWorkflow (config: INodeDef[]): Workflow {
    let wf = new Workflow(config);
    this.workflows[wf.uuid] = wf;
    return wf;
  }
  start (uuid: string): void {
    this.workflows[uuid].start();
  }
  stop (uuid: string): void {
    this.workflows[uuid].stop();
  }
  getNodeTypes (): INodeCollection {
    return this.registeredNodes.reduce((obj, node) => {
      obj[node.type].push(node.name);
      return obj;
    }, {source: [], transformer: [], sink: []});
  }
  source(name: string, factory: Function): Function { return this.register('source', name, factory); }
  transformer(name: string, factory: Function): Function { return this.register('transformer', name, factory); }
  sink(name: string, factory: Function): Function { return this.register('sink', name, factory); }

  // TODO: new type of registration that's just a singleton
  // Just calls INodeFactory and returns the symbol
  private register(type: string, name: string, factory): INodeFactory {

    // Names must be unique
    const exists = this.registeredNodes.filter((regNode) => regNode.name === name);
    if (exists.length) {
      throw new Error(name + ' already registered');
    }
    this.registeredNodes.push({
      type,
      name,
      factory
    });

    return this.makeNode.bind(this, name);
  }
};

export let gustav = new Gustav();
<<<<<<< Updated upstream
=======

// Meta nodes
gustav.transformer('__gmergeNode', (config, iO) => {
  return Observable.merge(...config.nodes);
});
>>>>>>> Stashed changes
