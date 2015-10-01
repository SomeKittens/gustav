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
        var _this = this;
        // TODO: Return some sort of object so this can be chained
        // let splitText = SplitText()
        // .addDep(fetchPageText);
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
        this.ggraph.makeGraph();
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
