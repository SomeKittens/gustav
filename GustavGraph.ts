'use strict';

let Rx = require('@reactivex/rxjs');

interface Edge {
  from: symbol;
  to: symbol;
}

class GustavGraph {
  sinkEdges: Edge[];
  transformEdges: Object;
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
}

export default GustavGraph;