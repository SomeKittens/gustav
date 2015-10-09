/// <reference path="typings/tsd.d.ts" />
/// <reference path="Symbol.d.ts" />
'use strict';
var Workflow_1 = require('./Workflow');
var Gustav = (function () {
    function Gustav() {
        this.registeredNodes = [];
    }
    // TODO: new type of registration that's just a singleton
    // Just calls NodeFactory and returns the symbol
    Gustav.prototype.register = function (type, name, factory) {
        // TODO: Return some sort of object so this can be chained
        // let splitText = SplitText()
        // .addDep(fetchPageText);
        // Names must be unique
        var exists = this.registeredNodes.filter(function (x) { return x.name === name; });
        if (exists.length) {
            throw new Error(name + ' already registered');
        }
        this.registeredNodes.push({
            type: type,
            name: name,
            factory: factory
        });
        return this.makeNode.bind(this, name);
    };
    Gustav.prototype.makeNode = function (nodeName, graph) {
        var config = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            config[_i - 2] = arguments[_i];
        }
        var node = this.registeredNodes.filter(function (x) { return x.name === nodeName; })[0];
        if (!node) {
            throw new Error(nodeName + ' not registered');
        }
        // Attempt to detect config to make symbol tag more descriptive
        var symbolTag = node.name;
        if (config.length) {
            if (!(config[0] instanceof Object)) {
                symbolTag += '-' + config[0];
            }
            else if (config[0].id) {
                symbolTag += '-' + config[0].id;
            }
        }
        var sym = Symbol(symbolTag);
        graph.nodes[sym] = {
            type: node.type,
            init: node.factory.apply(null, config)
        };
        return sym;
    };
    Gustav.prototype.makeWorkflow = function (config) {
        return new Workflow_1.Workflow(config);
    };
    Gustav.prototype.getNodeTypes = function () {
        return this.registeredNodes.reduce(function (obj, node) {
            obj[node.type].push(node.name);
            return obj;
        }, { source: [], transformer: [], sink: [] });
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
