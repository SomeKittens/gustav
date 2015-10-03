/// <reference path="typings/tsd.d.ts" />
/// <reference path="Symbol.d.ts" />
'use strict';
var Rx = require('@reactivex/rxjs');
var GustavGraph_1 = require('./GustavGraph');
var Gustav = (function () {
    function Gustav() {
        this.ggraph = new GustavGraph_1.default();
        this.registeredNodes = {
            source: [],
            transformer: [],
            sink: []
        };
    }
    // TODO: new type of registration that's just a singleton
    // Just calls NodeFactory and returns the symbol
    Gustav.prototype.register = function (type, name, factory) {
        // TODO: Return some sort of object so this can be chained
        // let splitText = SplitText()
        // .addDep(fetchPageText);
        var _this = this;
        // Names must be unique
        if (this.registeredNodes[type].indexOf(name) > -1) {
            throw new Error(name + ' already registered');
        }
        this.registeredNodes[type].push(name);
        return function () {
            var config = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                config[_i - 0] = arguments[_i];
            }
            // Attempt to detect config to make symbol tag more descriptive
            var symbolTag = name;
            if (config.length) {
                if (!(config[0] instanceof Object)) {
                    symbolTag += '-' + config[0];
                }
                else if (config[0].id) {
                    symbolTag += '-' + config[0].id;
                }
            }
            var sym = Symbol(symbolTag);
            _this.ggraph.nodes[sym] = {
                type: type,
                init: factory.apply(null, config)
            };
            return sym;
        };
    };
    Gustav.prototype.init = function () {
        var _this = this;
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
            // TODO: try/catch here and throw relevant error
            // Will break with
            // gustav.addDep(consoleSink(), logParser());
            // gustav.addDep(logParser(), logGenerator())
            // (Two different logParsers)
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
    Gustav.prototype.addDep = function (from, to) {
        this.ggraph.addEdge(from, to);
    };
    Gustav.prototype.source = function (name, factory) { return this.register('source', name, factory); };
    Gustav.prototype.transformer = function (name, factory) { return this.register('transformer', name, factory); };
    Gustav.prototype.sink = function (name, factory) { return this.register('sink', name, factory); };
    return Gustav;
})();
;
// REVIEW: How to handle below:
// let gustavs = {};
// let getGustavs = (name:string) => {
//   if (!gustavs[name]) {
//     gustavs[name] = new Gustav();
//   }
//   return gustavs[name];
// };
exports.gustav = new Gustav();
