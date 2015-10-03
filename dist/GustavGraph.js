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
    return GustavGraph;
})();
exports.default = GustavGraph;
