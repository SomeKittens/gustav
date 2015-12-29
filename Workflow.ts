'use strict';

// workflow datums
import {GustavGraph} from './GustavGraph';
import {gustav} from './index';
import {Observable} from '@reactivex/rxjs';
import * as uuid from 'node-uuid';
import {INodeDef, ISourceNode, ITransfNode, ISinkNode} from './defs';

export interface IStrongNodeDef extends INodeDef {
  dataFrom: number[];
}

export interface IWorkflowChain {
  prevNode: symbol;
  transf(name: string | ITransfNode, config?): IWorkflowChain;
  sink(name: string | ISinkNode, config?): Workflow;
  merge(...nodes: IWorkflowChain[]): IWorkflowChain;
  tap(name: string | ISinkNode, config?): IWorkflowChain;
  clone(): IWorkflowChain;
}

export interface IMetadataFactory {
  (name: string): Function;
}

export class Workflow {
  ggraph: GustavGraph;
  isStarted: boolean;
  uuid: string;
  listeners: INodeDef[];
  nodeDefs: IStrongNodeDef[];
  createdFromJSON: boolean;
  private unsubs: any;
  private metadataFuncs: IMetadataFactory[];
  constructor(public name?: string) {
    this.uuid = uuid.v4();
    this.listeners = [];
    this.ggraph = new GustavGraph();
    this.metadataFuncs = [];

    this.init();
  }
  start(): Workflow {
    this.isStarted = true;
    // traverse & run graph
    let cache = {};
    let seen = [];
    let sources = [];

    let resolveDeps = (nodeName: symbol) => {
      // We're sure it's not a loop here because we resolveDeps before adding to cache.
      if (cache[nodeName]) {
        return cache[nodeName];
      }

      if (seen.indexOf(nodeName) > -1) {
        throw new Error('Loop detected in dependency graph: ' + nodeName.toString());
      }
      seen.push(nodeName);


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

      if (this.metadataFuncs.length) {
        let strName = nodeName.toString().replace(/Symbol\((.*)\)$/, '$1');
        this.metadataFuncs.forEach(func => {
          result.subscribe(func(strName));
        });
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

    return this;
  }
  stop(): Workflow {
    this.unsubs.forEach(sub => sub.unsubscribe());
    this.init();
    return this;
  }
  // DEPRECATED
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
  addMetadataFunction (func: IMetadataFactory): Workflow {
    this.metadataFuncs.push(func);
    return this;
  }
  source (sourceName: string | ISourceNode, SourceConfig?: Object): IWorkflowChain {
    let registerTmpNode = (type, factory): string => {
      let name = uuid.v4();
      gustav[type](name, factory);
      return name;
    };
    if (typeof sourceName !== 'string') {
      sourceName = registerTmpNode('source', sourceName);
    }
    let prevNode = gustav.makeNode(<string>sourceName, this.ggraph, SourceConfig);
    return new WorkflowChain(this, prevNode);
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
  toJSON (): INodeDef[] {
    let wfDef = [];
    let id = 0;
    let cache = [];

    let getNodeData = (sym: symbol): Number => {
      if (cache[sym]) {
        return cache[sym];
      }
      let node: INodeDef = {
        id: id++,
        name: sym.toString().replace(/Symbol\((.*)\)$/, '$1'),
        type: this.ggraph.nodes[sym].type
      };
      if (node.type !== 'source') {
        node.dataFrom = this.ggraph.transformEdges[sym].map(getNodeData);
      }
      if (this.ggraph.nodes[sym].config) {
        node.config = this.ggraph.nodes[sym].config;
      }
      wfDef.push(node);

      cache[sym] = node.id;
      return node.id;
    };

    let sinkEdges = this.ggraph.getSinkEdges();
    Object.getOwnPropertySymbols(sinkEdges).map(key => {
      let node: INodeDef = {
        id: id++,
        name: key.toString().replace(/Symbol\((.*)\)$/, '$1'),
        dataFrom: sinkEdges[key].map(getNodeData),
        config: this.ggraph.nodes[key].config,
        type: 'sink'
      };
      if (this.ggraph.nodes[key].config) {
        node.config = this.ggraph.nodes[key].config;
      }
      wfDef.push(node);
    });

    return wfDef;
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

// Thought: What if we allowed multiples?
// .source(bill, bob, valentina)
// Just automerged behind the scenes.
class WorkflowChain {
  // prevNode tracks whatever node we've touched last
  constructor(public workflow: Workflow, public prevNode: symbol) {}
  transf (name: string | ITransfNode, config?): IWorkflowChain {
    this.addNodeToGraph(name, 'transformer', config, true);
    return new WorkflowChain(this.workflow, this.prevNode);
  }
  sink (name: string | ISinkNode, config?): Workflow {
    // Add the sink to the graph
    this.addNodeToGraph(name, 'sink', config);

    // return the workflow
    return this.workflow;
  }
  merge (...chains: IWorkflowChain[]): IWorkflowChain {
    // TODO: Support adding a registered node here
    let nodes = chains.map(chain => chain.prevNode);
    nodes.push(this.prevNode);
    let mergeNode = gustav.makeNode('__gmergeNode', this.workflow.ggraph, nodes);

    nodes.forEach(node => this.workflow.ggraph.addEdge(mergeNode, node));
    this.prevNode = mergeNode;
    return new WorkflowChain(this.workflow, this.prevNode);
  }
  tap (name: string | ISinkNode, config?): IWorkflowChain {
    this.addNodeToGraph(name, 'sink', config);
    return new WorkflowChain(this.workflow, this.prevNode);
  }
  clone(): IWorkflowChain {
    return new WorkflowChain(this.workflow, this.prevNode);
  }

  /**
   * Adds node to our internal ggraph, registering if needed
   * @name {name of node (can be factory)}
   * @type {what type of node: source/transf/sink}
   * @config {Configuration for the node}
   * @replaceOld {Should we overwrite prevNode?}
   */
  private addNodeToGraph(name, type: string, config?, replaceOld?): void {
    if (typeof name !== 'string') {
      name = this.registerTmpNode(type, name);
    }
    let currentNode = gustav.makeNode(name, this.workflow.ggraph, config);

    this.workflow.ggraph.addEdge(currentNode, this.prevNode);

    if (replaceOld) {
      this.prevNode = currentNode;
    }
  }
  // Allows us to use user-provided factories
  private registerTmpNode (type, factory): string {
    let name = uuid.v4();
    gustav[type](name, factory);
    return name;
  }
}
