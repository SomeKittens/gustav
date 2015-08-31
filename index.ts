/// <reference path="typings/tsd.d.ts" />

'use strict';

import * as fs from 'fs';
import {Observable} from 'rx';

module Gustav {

  // Using classes instead of interfaces for run-time info
  export class Node {
    constructor() {};
    // static dependencies() {};
  }

  export class Source extends Node {}
  export class Transformer extends Node {}
  export class Sink extends Node {}

  export function noop () {}

  export function init (...nodes:Array<Node>) {

    let depTree = [];
    let cache = {};

    function callSomething(currentDepTree, taskList:Array<any>):any {
      return taskList.map((Task) => {
        // Build this layer of the dependency tree
        let currentDeps = {};
        let name = Task.name;
        let deps = null;

        // TODO: Throw if given a non-Source class with no deps
        if (Task.dependencies) {
          // Three possiblities
          // - Function, instanceof Node
          // - Array<Node>
          // - Function, returns one of the above
          if (Task.dependencies.prototype instanceof Node || Array.isArray(Task.dependencies)) {
            deps = Task.dependencies;
          } else {
            deps = Task.dependencies();
          }
        }

        currentDeps[name] = deps ? [] : null;
        let newLen = currentDepTree.push(currentDeps);

        // If we've already created this Node, don't instantiate another
        // TODO: Allow recreation
        if (cache[name]) {
          return cache[name];
        }

        let node = new Task();

        if (deps) {
          if(!(deps instanceof Array)) {
            deps = [deps];
          }
          let upstream = callSomething(currentDepTree[newLen - 1][name], deps);
          if (upstream.length === 1) {
            upstream = upstream[0];
          } else {
            upstream = Observable.merge(upstream);
          }
          cache[name] = node.run(upstream);
        } else {
          cache[name] = node.run();
        }
        return cache[name];
      });
    }

    callSomething(depTree, nodes);
    // console.log(JSON.stringify(depTree));
  }

  function cacheOutput (name, observable:Observable<any>) {
    let outputStream = fs.createWriteStream('./data/' + name);

    observable
    .subscribe((datums) => {
      outputStream.write(datums);
    });
  }
}

export default Gustav;