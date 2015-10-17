'use strict';

interface IEdge {
  from: symbol;
  to: symbol;
}

export class GustavGraph {
  sinkEdges: IEdge[];
  transformEdges: Object;
  nodes: Object;
  constructor() {
    this.sinkEdges = [];
    this.transformEdges = {};
    this.nodes = {};
  }
  addEdge(from: symbol, to: symbol): void {
    if (!from) { throw new Error('From node not defined'); }
    if (!to) { throw new Error(/*to node defined, or */'To node not defined'/*that is the question*/); }
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
      throw new Error('Sources cannot have dependencies: ' + from.toString());
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
  getSinkEdges(): Object {
    return this.sinkEdges.reduce((obj, edge) => {
      if (!obj[edge.from]) {
        obj[edge.from] = [];
      }
      obj[edge.from].push(edge.to);
      return obj;
    }, {});
  }
}
