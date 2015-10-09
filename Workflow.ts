'use strict';

// workflow datums
import {GustavGraph} from './GustavGraph';
import {gustav} from './index';

let Rx = require('@reactivex/rxjs');
let guid = require('node-guid');

export interface NodeDef {
  name: string;
  type?: string; // probably not needed
  config?: any;
  dataFrom: number;
  id: number;
}

export class Workflow {
  ggraph: GustavGraph;
  isStarted: boolean;
  guid: string;
  constructor(public nodeDefs: NodeDef[]) {
    this.isStarted = false;
    this.guid = guid.new();
    // array since the keys are numbers
    let idSymbolMap = [];
    // Add datas to GG
    this.ggraph = new GustavGraph();
    // Create a new node for each def
    nodeDefs.forEach(def => {
      let sym = gustav.makeNode(def.name, this.ggraph, def.config);
      idSymbolMap[def.id] = sym;
    });

    // add a dependencies based on ID
    // TODO: This assumes that each node only has a single source of data
    nodeDefs.forEach(def => {
      if (!def.dataFrom) { return; }
      this.ggraph.addEdge(idSymbolMap[def.id], idSymbolMap[def.dataFrom]);
    });
  }
  init() {
    this.isStarted = true;
    // traverse & run graph
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
  // TODO:
  // Adds a stealth sink that allows us to listen in on the workflow output
  addListener (def:NodeDef) {
    if (this.isStarted) {
      // TODO: Support this
      throw new Error('Attempted to add a listener to an ongoing Workflow');
    }

    let listenerNode = gustav.makeNode(def.name, this.ggraph, def.config);

    console.log(this.ggraph.sinkEdges);

    this.ggraph.sinkEdges
      .map(edge => edge.to)
      .filter(sym => !console.log(sym))
      .forEach(sym => this.ggraph.addEdge(listenerNode, sym));
  }
}