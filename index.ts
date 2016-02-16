'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {GustavGraph} from './GustavGraph';
import {Workflow} from './Workflow';
import {IMetaConfig, ICoupler} from './defs';

import * as GR from './couplers/GustavRedis';
import * as GK from './couplers/GustavKafka';

export let GustavRedis = GR.GustavRedis;
export let GustavKafka = GK.GustavKafka;

export interface INodeFactory {
  (...config: any[]): symbol;
}

export interface INodeCollection {
  source: string[];
  transformer: string[];
  sink: string[];
}

export interface IRegisteredNode {
  name: string;
  factory: Function;
}

let registeredNodes: IRegisteredNode[] = [];
let workflows = {};
let register;
let anonWfId = 0;

// Meta nodes
// TODO: move into its own file
let registerMetaNodes = (gustav) => {
  gustav.transformer('__gmergeNode', (nodes, iO) => {
    return iO.do(() => {});
  });
};

export let gustav = {
  makeNode: (nodeName: string, type: string, graph: GustavGraph, config: any, metaConfig?: IMetaConfig): symbol => {
    let node = registeredNodes.filter((regNode) => regNode.name === nodeName)[0];

    if (!node) {
      throw new Error(nodeName + ' not registered');
    }

    // Attempt to detect config to make symbol tag more descriptive
    let symbolTag = node.name;
    if (metaConfig && metaConfig.gid) {
      symbolTag += '-' + metaConfig.gid;
    }
    let sym = Symbol(symbolTag);
    graph.nodes[sym] = {
      type,
      config: config, // Storing config here for later toJSON calls
      init: config ? node.factory.bind(null, config) : node.factory
    };
    return sym;
  },
  /**
   * Create an empty workflow to be chained off of
   * @param {string} uuid [description]
   */
  createWorkflow (name?: string): Workflow {
    let wf = new Workflow(name || `Unnamed Workflow ${anonWfId++}`);
    workflows[wf.uuid] = wf;
    return wf;
  },
  start: (uuid: string): void => {
    workflows[uuid].start();
  },
  stop: (uuid: string): void => {
    workflows[uuid].stop();
  },
  reset: (): void => {
    anonWfId = 0;
    workflows = {};
    registeredNodes = [];
    registerMetaNodes(gustav);
  },
  // Currently we don't have types 100% of the time with the new autoregistration system
  // Taking this out until we figure out a way to do that
  // getNodeTypes: (): INodeCollection => {
  //   return registeredNodes.reduce((obj, node) => {
  //     obj[node.type].push(node.name);
  //     return obj;
  //   }, {source: [], transformer: [], sink: []});
  // },
  makeGraph: (): any => {
    let id = 0;
    let graph = {
      nodes: [],
      links: []
    };
    let exInGraph = exName => graph.nodes.some(node => node.name === exName);
    let getIdByName = name => graph.nodes.filter(node => node.name === name)[0].id;

    Object.keys(workflows).forEach(wfKey => {
      let wf = workflows[wfKey];
      let sourceId = id;
      graph.nodes.push({
        type: 'workflow',
        id: id,
        name: wf.name
      });
      id++;

      wf.external.source.forEach(exSource => {
        let thisId;
        if (!exInGraph(exSource)) {
          graph.nodes.push({
            type: 'external',
            id: id,
            name: exSource
          });
          thisId = id;
          id++;
        }
        graph.links.push({
          source: thisId || getIdByName(exSource),
          target: sourceId
        });
      });

      wf.external.sink.forEach(exSource => {
        let thisId;
        if (!exInGraph(exSource)) {
          graph.nodes.push({
            type: 'external',
            id: id,
            name: exSource
          });
          thisId = id;
          id++;
        }
        graph.links.push({
          source: sourceId,
          target: thisId || getIdByName(exSource)
        });
      });
    });

    return graph;
  },
  addCoupler: (externalCoupler: ICoupler, couplerName?: string): void => {
    if (!couplerName) {
      couplerName = externalCoupler.defaultName;
    }
    gustav.source(`__from-${couplerName}`, (name) => externalCoupler.from(name));
    gustav.sink(`__to-${couplerName}`, (name, iO) => externalCoupler.to(name, iO));
  },
  source: (name: string, factory: Function): Function =>  { return register('source', name, factory); },
  transformer: (name: string, factory: Function): Function => { return register('transformer', name, factory); },
  sink: (name: string, factory: Function): Function => { return register('sink', name, factory); }
};

// TODO: new type of registration that's just a singleton
// Just calls INodeFactory and returns the symbol

// Outside of the exported object so this is private
register = (type: string, name: string, factory): INodeFactory => {
  if (!name) {
    throw new Error('Attempted to register a node without providing a name');
  }
  if (!factory) {
    throw new Error(`Attempted to register node ${name} without providing a factory`);
  }

  // Names must be unique
  const exists = registeredNodes.filter((regNode) => regNode.name === name);
  if (exists.length) {
    throw new Error(`${name} already registered`);
  }
  registeredNodes.push({
    name,
    factory
  });

  return gustav.makeNode.bind(null, name, type);
};

/**
 * Searches through your project's node_modules folder and autoloads any module with the prefix `gustav-`
 * @param {...filenames} Optional array of filenames to also load
 */
// Known bug: only works if filenames are relative to where node was executed (not the file that called autoregister)
export let autoregister = (...filenames) => {
  let x = new Error('pants');
  console.log(x.stack.split('\n')[2]);



  // read all folders in node_modules, filter by `gustav-` prefix
  let modules = path.join(process.cwd(), 'node_modules');

  let gmodules = fs.readdirSync(modules)
    .filter((file) => fs.statSync(path.join(modules, file)).isDirectory() && file.indexOf('gustav-') === 0)
    .map(filename => path.join(process.cwd(), 'node_modules', filename));

  // For all folders in node_modules + all filenames passed in
  gmodules
    .concat(filenames.map(fn => path.join(process.cwd(), fn)))
    .forEach(modName => {
      let nodes = require(modName);
      Object.keys(nodes)
        .forEach(key => {
          let node = registeredNodes.filter((regNode) => regNode.name === key)[0];
          if (node) {
            throw new Error(`Attempted to register node named ${key} but a node with that name already exists`);
          }
          registeredNodes.push({
            name: key,
            factory: nodes[key]
          });
        });
    });
};

registerMetaNodes(gustav);
