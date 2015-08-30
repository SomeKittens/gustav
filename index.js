/// <reference path="typings/tsd.d.ts" />
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var fs = require('fs');
var Rx = require('rx');
var Gustav;
(function (Gustav) {
    // Using classes instead of interfaces for run-time info
    var Node = (function () {
        function Node() {
        }
        ;
        return Node;
    })();
    Gustav.Node = Node;
    var Source = (function (_super) {
        __extends(Source, _super);
        function Source() {
            _super.apply(this, arguments);
        }
        return Source;
    })(Node);
    Gustav.Source = Source;
    var Transformer = (function (_super) {
        __extends(Transformer, _super);
        function Transformer() {
            _super.apply(this, arguments);
        }
        return Transformer;
    })(Node);
    Gustav.Transformer = Transformer;
    var Sink = (function (_super) {
        __extends(Sink, _super);
        function Sink() {
            _super.apply(this, arguments);
        }
        return Sink;
    })(Node);
    Gustav.Sink = Sink;
    function noop() { }
    Gustav.noop = noop;
    function init() {
        var nodes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            nodes[_i - 0] = arguments[_i];
        }
        var depTree = [];
        var cache = {};
        function callSomething(currentDepTree, taskList) {
            return taskList.map(function (Task) {
                // Build this layer of the dependency tree
                var o = {};
                var name = Task.name;
                var deps = null;
                // TODO: Throw if given a non-Source class with no deps
                if (Task.dependencies) {
                    // Three possiblities
                    // - Function, instanceof Node
                    // - Array<Node>
                    // - Function, returns one of the above
                    if (Task.dependencies.prototype instanceof Node || Array.isArray(Task.dependencies)) {
                        deps = Task.dependencies;
                    }
                    else {
                        deps = Task.dependencies();
                    }
                }
                o[name] = deps ? [] : null;
                var newLen = currentDepTree.push(o);
                // If we've already created this Node, don't instantiate another
                // TODO: Allow recreation
                if (cache[name]) {
                    return cache[name];
                }
                var n = new Task();
                if (deps) {
                    if (!(deps instanceof Array)) {
                        deps = [deps];
                    }
                    var upstream = callSomething(currentDepTree[newLen - 1][name], deps);
                    if (upstream.length === 1) {
                        upstream = upstream[0];
                    }
                    else {
                        upstream = Rx.Observable.merge(upstream);
                    }
                    cache[name] = n.run(upstream);
                }
                else {
                    cache[name] = n.run();
                }
                return cache[name];
            });
        }
        callSomething(depTree, nodes);
        // console.log(JSON.stringify(depTree));
    }
    Gustav.init = init;
    function cacheOutput(name, observable) {
        var outputStream = fs.createWriteStream('./data/' + name);
        observable
            .subscribe(function (datums) {
            outputStream.write(datums);
        });
    }
    // TODO: create annotation that logs output of Node
    function an() {
        console.log('annotated');
    }
})(Gustav || (Gustav = {}));
module.exports = Gustav;
