/// <reference path="typings/tsd.d.ts" />
/// <reference path="Symbol.d.ts" />

'use strict';

import {GustavGraph} from './GustavGraph';
import {Workflow, NodeDef} from './Workflow';

interface NodeFactory {
  (...config:any[]): symbol;
}

interface NodeCollection {
  source: string[];
  transformer: string[];
  sink: string[];
}

interface RegisteredNode {
  name: string;
  type: string;
  factory: Function;
}

class Gustav {
  registeredNodes: RegisteredNode[];
  constructor() {
    this.registeredNodes = [];
  }
  // TODO: new type of registration that's just a singleton
  // Just calls NodeFactory and returns the symbol
  private register(type: string, name: string, factory): NodeFactory {
    // TODO: Return some sort of object so this can be chained
    // let splitText = SplitText()
    // .addDep(fetchPageText);

    // Names must be unique
    const exists = this.registeredNodes.filter((x) => x.name === name);
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
  makeNode (nodeName:string, graph: GustavGraph, ...config) {
    var node = this.registeredNodes.filter((x) => x.name === nodeName)[0];

    if (!node) {
      throw new Error(nodeName + ' not registered');
    }

    // Attempt to detect config to make symbol tag more descriptive
    let symbolTag = node.name;
    if (config.length) {
      if(!(config[0] instanceof Object)) {
        symbolTag += '-' + config[0];
      } else if (config[0].id) {
        symbolTag += '-' + config[0].id;
      }
    }
    let sym = Symbol(symbolTag);
    graph.nodes[sym] = {
      type: node.type,
      init: node.factory.apply(null, config)
    };
    return sym;
  }
  makeWorkflow (config:NodeDef[]) {
    return new Workflow(config);
  }
  getNodeTypes ():NodeCollection {
    return this.registeredNodes.reduce((obj, node) => {
      obj[node.type].push(node.name);
      return obj;
    }, {source: [], transformer: [], sink: []});
  }
  source(name: string, factory: Function) { return this.register('source', name, factory)}
  transformer(name: string, factory: Function) { return this.register('transformer', name, factory)}
  sink(name: string, factory: Function) { return this.register('sink', name, factory)}
};

// REVIEW: How to handle below:

// let gustavs = {};

// let getGustavs = (name:string) => {
//   if (!gustavs[name]) {
//     gustavs[name] = new Gustav();
//   }
//   return gustavs[name];
// };

export var gustav = new Gustav();
