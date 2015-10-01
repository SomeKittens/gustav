'use strict';
var Rx = require('@reactivex/rxjs');
var GustavGraph = (function () {
    function GustavGraph() {
        this.sinkEdges = [];
        this.transformEdges = {};
        this.nodes = {};
    }
    GustavGraph.prototype.addEdge = function (from, to) {
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
            throw new Error('Loaders cannot have dependencies: ' + from.toString());
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
        }
        else {
            if (!this.transformEdges[from]) {
                this.transformEdges[from] = [];
            }
            this.transformEdges[from].push(to);
        }
    };
    GustavGraph.prototype.makeGraph = function () {
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
            if (_this.nodes[nodeName].type === 'source') {
                return _this.nodes[nodeName].init();
            }
            // TODO: try/catch here and throw relevant error
            // Will break with
            // gustav.addDep(consoleSink(), logParser());
            // gustav.addDep(logParser(), logGenerator())
            // (Two different logParsers)
            // console.log('bananas', nodeName);
            var nextNode = _this.transformEdges[nodeName].map(resolveDeps);
            // console.log('asdf', nodeName, nextNode);
            if (nextNode.length) {
                nextNode = Rx.Observable.merge.apply(null, nextNode);
            }
            var result = cache[nodeName] = _this.nodes[nodeName].init(nextNode);
            return result;
        };
        // All sinks are terminal
        // For each sinkEdge, find the next item
        this.sinkEdges.forEach(function (edge) {
            seen = [];
            var x = resolveDeps(edge.to);
            _this.nodes[edge.from].init(x);
        });
    };
    return GustavGraph;
})();
exports.default = GustavGraph;
