'use strict';

import {StatScanner} from './StatScanner';
let Rx = require('@reactivex/rxjs');

interface Edge {
  from: symbol;
  to: symbol;
}

class GustavGraph {
  private sinkEdges: Edge[];
  private transformEdges: Object;
  nodes: Object;
  constructor() {
    this.sinkEdges = [];
    this.transformEdges = {};
    this.nodes = {};
  }
  addEdge(from: symbol, to: symbol) {
    if (!this.nodes[from]) {
      throw new Error('From node ' + from.toString() + ' not registered');
    }
    if (!this.nodes[to]) {
      throw new Error('To node ' + to.toString() + ' not registered');
    }
    if (from === to) {
      throw new Error('Nodes cannot depend on themselves: ' + from.toString());
    }
    if (this.nodes[from].type === 'source') {
      throw new Error('Loaders cannot have dependencies: ' + from.toString());
    }
    if (this.nodes[to].type === 'sink') {
      throw new Error('Sinks cannot be depended on: ' /*they're sneaky like that*/ + to.toString());
    }

    if (this.nodes[from].type === 'sink') {
      // Cant use destructuring here because from/to are Symbols
      this.sinkEdges.push({
        from: from,
        to: to
      });
    } else {
      if (!this.transformEdges[from]) {
        this.transformEdges[from] = [];
      }
      this.transformEdges[from].push(to);
    }
  }
  makeGraph() {
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
      if (this.nodes[nodeName].type === 'source') {
        let ss = new StatScanner(nodeName, 1000);
        let called = 0;
        setInterval(() => console.log(nodeName, 'called', called), 1000);
        return this.nodes[nodeName].init().do(() => {
          called++;
          ss.add();
        });
      }

      // TODO: try/catch here and throw relevant error
      // Will break with
      // gustav.addDep(consoleSink(), logParser());
      // gustav.addDep(logParser(), logGenerator())
      // (Two different logParsers)
      let nextNode = this.transformEdges[nodeName].map(resolveDeps);
      if (nextNode.length) {
        nextNode = Rx.Observable.merge.apply(null, nextNode);
      }

      let result = cache[nodeName] = this.nodes[nodeName].init(nextNode);

      let ss = new StatScanner(nodeName, 1000);
      let called = 0;
      setInterval(() => console.log(nodeName, 'called', called), 1000);
      return result.do(() => {
        called++;
        ss.add();
      });
    };
    // All sinks are terminal
    // For each sinkEdge, find the next item
    this.sinkEdges.forEach(edge => {
      console.log(edge);
      seen = [];
      var x = resolveDeps(edge.to);
      this.nodes[edge.from].init(x);
    });
  }
}

export default GustavGraph;