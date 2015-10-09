'use strict';
// workflow datums
var GustavGraph_1 = require('./GustavGraph');
var index_1 = require('./index');
var Rx = require('@reactivex/rxjs');
var guid = require('node-guid');
var Workflow = (function () {
    function Workflow(nodeDefs) {
        var _this = this;
        this.nodeDefs = nodeDefs;
        this.isStarted = false;
        this.guid = guid.new();
        // array since the keys are numbers
        var idSymbolMap = [];
        // Add datas to GG
        this.ggraph = new GustavGraph_1.GustavGraph();
        // Create a new node for each def
        nodeDefs.forEach(function (def) {
            var sym = index_1.gustav.makeNode(def.name, _this.ggraph, def.config);
            idSymbolMap[def.id] = sym;
        });
        // add a dependencies based on ID
        // TODO: This assumes that each node only has a single source of data
        nodeDefs.forEach(function (def) {
            if (!def.dataFrom) {
                return;
            }
            _this.ggraph.addEdge(idSymbolMap[def.id], idSymbolMap[def.dataFrom]);
        });
    }
    Workflow.prototype.init = function () {
        var _this = this;
        this.isStarted = true;
        // traverse & run graph
        var cache = {};
        var seen = [];
        var resolveDeps = function (nodeName) {
            if (seen.indexOf(nodeName) > -1) {
                throw new Error('Loop detected in dependency graph');
            }
            seen.push(nodeName);
            if (cache[nodeName]) {
                return cache[nodeName];
            }
            // All loaders do not have deps
            if (_this.ggraph.nodes[nodeName].type === 'source') {
                return _this.ggraph.nodes[nodeName].init();
            }
            var nextNode = _this.ggraph.transformEdges[nodeName].map(resolveDeps);
            if (nextNode.length) {
                nextNode = Rx.Observable.merge.apply(null, nextNode);
            }
            var result = cache[nodeName] = _this.ggraph.nodes[nodeName].init(nextNode);
            return result;
        };
        // All sinks are terminal
        // For each sinkEdge, find the next item
        this.ggraph.sinkEdges.forEach(function (edge) {
            seen = [];
            var x = resolveDeps(edge.to);
            _this.ggraph.nodes[edge.from].init(x);
        });
    };
    // TODO:
    // Adds a stealth sink that allows us to listen in on the workflow output
    Workflow.prototype.addListener = function (def) {
        var _this = this;
        if (this.isStarted) {
            // TODO: Support this
            throw new Error('Attempted to add a listener to an ongoing Workflow');
        }
        var listenerNode = index_1.gustav.makeNode(def.name, this.ggraph, def.config);
        console.log(this.ggraph.sinkEdges);
        this.ggraph.sinkEdges
            .map(function (edge) { return edge.to; })
            .filter(function (sym) { return !console.log(sym); })
            .forEach(function (sym) { return _this.ggraph.addEdge(listenerNode, sym); });
    };
    return Workflow;
})();
exports.Workflow = Workflow;
