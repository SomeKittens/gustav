'use strict';

// workflow datums
import {GustavGraph} from './GustavGraph';
import {gustav} from './index';
import {Observable} from '@reactivex/rxjs';

let guid = require('node-guid');

export interface NodeDef {
  name: string;
  type?: string; // probably not needed
  config?: any;
  dataFrom: number[] | number;
  id: number;
}

interface StrongNodeDef extends NodeDef {
  dataFrom: number[];
}

export class Workflow {
  ggraph: GustavGraph;
  isStarted: boolean;
  guid: string;
  listeners: NodeDef[];
  nodeDefs: StrongNodeDef[];
  private unsubs: any;
  constructor(_nodeDefs: NodeDef[]) {
    this.guid = guid.new();
    this.listeners = [];

    this.nodeDefs = _nodeDefs.map((def):StrongNodeDef => {
      if (typeof def.dataFrom === 'number') {
        def.dataFrom = [<number>def.dataFrom];
      }
      return <StrongNodeDef>def;
    });

    this.init();
  }
  // Reset everything, destroying old references and saving memory
  private init() {
    this.isStarted = false;
    this.unsubs = [];

    // array since the keys are numbers
    let idSymbolMap = [];
    // Add datas to GG
    this.ggraph = new GustavGraph();

    // Create a new node for each def
    this.nodeDefs.forEach(def => {
      let sym = gustav.makeNode(def.name, this.ggraph, def.config);
      idSymbolMap[def.id] = sym;
    });

    // add a dependencies based on ID
    this.nodeDefs.forEach(def => {
      if (!def.dataFrom || !def.dataFrom.length) { return; }
      def.dataFrom.forEach(from =>  this.ggraph.addEdge(idSymbolMap[def.id], idSymbolMap[from]));
    });

    this.listeners.forEach(listener => this.addListener(listener));
  }
  start() {
    this.isStarted = true;
    // traverse & run graph
    let cache = {};
    let seen = [];

    let resolveDeps = (nodeName:symbol, finalNode:symbol) => {
      if (seen.indexOf(nodeName) > -1) {
        throw new Error('Loop detected in dependency graph');
      }
      seen.push(nodeName);

      if (cache[nodeName]) {
        return cache[nodeName];
      }
      // Base case: All sources do not have deps
      if (this.ggraph.nodes[nodeName].type === 'source') {
        return this.ggraph.nodes[nodeName].init();
      }

      let nextNode = this.ggraph.transformEdges[nodeName].map(dep => resolveDeps(dep, finalNode));
      if (nextNode.length) {
        nextNode = Observable.merge.apply(null, nextNode);
      }

      let result = this.ggraph.nodes[nodeName].init(nextNode);
      if (nodeName === finalNode) {
        result = result.publish();
      }
      cache[nodeName] = result;
      return result;
    };
    // All sinks are terminal
    // For each sinkEdge, find the next item
    let sinkEdges = this.ggraph.getSinkEdges();
    Object.getOwnPropertySymbols(sinkEdges).forEach(key => {
      let deps = sinkEdges[key].map(penultimateNodeSym => {
        // Reset loop checking
        seen = [];

        return resolveDeps(penultimateNodeSym, penultimateNodeSym);
      });

      let mergedDeps = Observable.merge.apply(null, deps);
      this.ggraph.nodes[key].init(mergedDeps);

      // Trigger the streams
      deps.forEach(dep => {
        let subscription = dep.connect();
        this.unsubs.push(subscription);
      });
    });

  }
  stop() {
    this.unsubs.forEach(sub => sub.unsubscribe());
    this.init();
  }
  // Adds a stealth sink that allows us to listen in on the workflow output
  addListener (def:NodeDef) {
    if (this.isStarted) {
      // TODO: Support this
      throw new Error('Attempted to add a listener to an ongoing Workflow');
    }

    let listenerNode = gustav.makeNode(def.name, this.ggraph, def.config);

    this.ggraph.sinkEdges
      .map(edge => edge.to)
      .forEach(sym => this.ggraph.addEdge(listenerNode, sym));

    this.listeners.push(def);
  }
}