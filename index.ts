/// <reference path="typings/tsd.d.ts" />
/// <reference path="Symbol.d.ts" />

'use strict';

let Rx = require('@reactivex/rxjs');

import GustavGraph from './GustavGraph';

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
  ggraph: GustavGraph;
  registeredNodes: RegisteredNode[];
  constructor() {
    this.ggraph = new GustavGraph();
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
  makeNode (nodeName:string, ...config) {
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
    this.ggraph.nodes[sym] = {
      type: node.type,
      init: node.factory.apply(null, config)
    };
    return sym;
  }
  getNodeTypes ():NodeCollection {
    return this.registeredNodes.reduce((obj, node) => {
      obj[node.type].push(node.name);
      return obj;
    }, {source: [], transformer: [], sink: []});
  }
  init () {
    let cache = {};
    let seen = [];

    let resolveDeps = (nodeName:symbol) => {
      if (seen.indexOf(nodeName) > -1) {
        throw new Error('Loop detected in dependency graph');
      }
      seen.push(nodeName);

      if (cache[nodeName]) {
        return cache[nodeName];
      }
      // All loaders do not have deps
      if (this.ggraph.nodes[nodeName].type === 'source') {
        return this.ggraph.nodes[nodeName].init();
      }

      // TODO: try/catch here and throw relevant error
      // Will break with
      // gustav.addDep(consoleSink(), logParser());
      // gustav.addDep(logParser(), logGenerator())
      // (Two different logParsers)
      let nextNode = this.ggraph.transformEdges[nodeName].map(resolveDeps);
      if (nextNode.length) {
        nextNode = Rx.Observable.merge.apply(null, nextNode);
      }

      let result = cache[nodeName] = this.ggraph.nodes[nodeName].init(nextNode);
      return result;
    };
    // All sinks are terminal
    // For each sinkEdge, find the next item
    this.ggraph.sinkEdges.forEach(edge => {
      seen = [];
      var x = resolveDeps(edge.to);
      this.ggraph.nodes[edge.from].init(x);
    });
  }
  addDep (from: symbol, to: symbol) {
    this.ggraph.addEdge(from, to);
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
