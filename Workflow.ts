'use strict';

// workflow datums
import {GustavGraph} from './GustavGraph';
import {gustav} from './index';
import {Observable} from '@reactivex/rxjs';
import * as uuid from 'node-uuid';

export interface INodeDef {
  name: string;
  type?: string; // probably not needed
  config?: any;
  dataFrom?: number[] | number; // Only on non-source nodes
  id: number;
}

interface IStrongNodeDef extends INodeDef {
  dataFrom: number[];
}

export class Workflow {
  ggraph: GustavGraph;
  isStarted: boolean;
  uuid: string;
  listeners: INodeDef[];
  nodeDefs: IStrongNodeDef[];
  createdFromJSON: boolean;
  private unsubs: any;
  constructor(public name?: string) {
    this.uuid = uuid.v4();
    this.listeners = [];
    this.ggraph = new GustavGraph();

    this.init();
  }
  start(): void {
    this.isStarted = true;
    // traverse & run graph
    let cache = {};
    let seen = [];
    let sources = [];

    let resolveDeps = (nodeName: symbol) => {
      if (seen.indexOf(nodeName) > -1) {
        throw new Error('Loop detected in dependency graph');
      }
      seen.push(nodeName);

      if (cache[nodeName]) {
        return cache[nodeName];
      }

      let result;
      // Base case: All sources do not have deps
      if (this.ggraph.nodes[nodeName].type === 'source') {
        result = this.ggraph.nodes[nodeName].init().publish();
        sources.push(result);
      } else {
        let nextNode = this.ggraph.transformEdges[nodeName].map(dep => resolveDeps(dep));
        if (nextNode.length) {
          nextNode = Observable.merge(...nextNode);
        }

        result = this.ggraph.nodes[nodeName].init(nextNode);
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
        return resolveDeps(penultimateNodeSym);
      });

      let mergedDeps = Observable.merge(...deps);
      this.ggraph.nodes[key].init(mergedDeps);
    });

    // Trigger the streams after everything's set up
    this.unsubs = sources.map(source => source.connect());

  }
  stop(): void {
    this.unsubs.forEach(sub => sub.unsubscribe());
    this.init();
  }
  // Adds a stealth sink that allows us to listen in on the workflow output
  addListener (def: INodeDef): void {
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
  source (name: string, config?: Object) {
    // Tracks whatever node we've touched last
    let prevNode = gustav.makeNode(name, this.ggraph, config);

    let returnable = {
      transf: (name: string, config?) => {
        let transfNode = gustav.makeNode(name, this.ggraph, config);

        this.ggraph.addEdge(transfNode, prevNode);
        prevNode = transfNode;
        return returnable;
      },
      sink: (name: string, config?): Workflow => {
        // Add the sink to the graph
        // return the workflow
        let sinkNode = gustav.makeNode(name, this.ggraph, config);
        this.ggraph.addEdge(sinkNode, prevNode);

        return this;
      },
      merge: (...nodes) => {
        let mergeNode = gustav.makeNode('__gmergeNode', this.ggraph, {nodes});

        this.ggraph.addEdge(mergeNode, prevNode);
        prevNode = mergeNode;
        return returnable;
      },
      tap: (name: string, config?) => {
        let sinkNode = gustav.makeNode(name, this.ggraph, config);
        this.ggraph.addEdge(sinkNode, prevNode);
        return returnable;
      }
    };

    return returnable;
  }
  /**
   * Creates a workflow from a JSON definition
   * @param  {INodeDef[]} config Array of node definitions to make the workflow from
   * @return {Workflow}          Workflow from said JSON
   */
  fromJSON (config: INodeDef[]): Workflow {
    if (Object.getOwnPropertySymbols(this.ggraph.nodes).length) {
      throw new Error('Tried to call fromJSON on a non-empty workflow');
    }

    this.createdFromJSON = true;
    this.nodeDefs = config.map((def): IStrongNodeDef => {
      if (typeof def.dataFrom === 'number') {
        def.dataFrom = [<number>def.dataFrom];
      }
      return <IStrongNodeDef>def;
    });

    this.init();
    return this;
  }
  // Reset everything, destroying old references and saving memory
  private init(): void {
    this.isStarted = false;
    this.unsubs = [];

    if (this.createdFromJSON) {
      this.initJSON();
    }
  }
  private initJSON(): void {
    // array since the keys are numbers
    let idSymbolMap = [];

    // Need to reset
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
}
