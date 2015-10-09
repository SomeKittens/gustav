'use strict';
var GustavGraph = (function () {
    function GustavGraph() {
        this.sinkEdges = [];
        this.transformEdges = {};
        this.nodes = {};
    }
    GustavGraph.prototype.addEdge = function (from, to) {
        if (!from) {
            throw new Error('From node not defined');
        }
        if (!to) {
            throw new Error(/*to node defined, or */ 'To node not defined' /*that is the question*/);
        }
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
            throw new Error('Sources cannot have dependencies: ' + from.toString());
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
exports.GustavGraph = GustavGraph;
