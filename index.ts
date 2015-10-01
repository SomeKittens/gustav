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

class Gustav {
  ggraph: GustavGraph;
  registeredNodes: NodeCollection;
  constructor() {
    this.ggraph = new GustavGraph();
    this.registeredNodes = {
      source: [],
      transformer: [],
      sink: []
    };
  }
  // TODO: new type of registration that's just a singleton
  // Just calls NodeFactory and returns the symbol
  private register(type: string, name: string, factory): NodeFactory {
    // TODO: Return some sort of object so this can be chained
    // let splitText = SplitText()
    // .addDep(fetchPageText);
    this.registeredNodes[type].push(name);

    return (...config) => {
      // Attempt to detect config to make symbol tag more descriptive
      let symbolTag = name;
      if (config.length) {
        if(!(config[0] instanceof Object)) {
          symbolTag += '-' + config[0];
        } else if (config[0].id) {
          symbolTag += '-' + config[0].id;
        }
      }
      let sym = Symbol(symbolTag);
      this.ggraph.nodes[sym] = {
        type,
        init: factory.apply(null, config)
      };
      return sym;
    };
  }
  init () {
    this.ggraph.makeGraph();
  }
  addDep (from: symbol, to: symbol) {
    this.ggraph.addEdge(from, to);
  }
  source(name: string, factory) { return this.register('source', name, factory)}
  transformer(name: string, factory) { return this.register('transformer', name, factory)}
  sink(name: string, factory) { return this.register('sink', name, factory)}
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
