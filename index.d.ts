/// <reference path="typings/tsd.d.ts" />
declare module Gustav {
    class Node {
        constructor();
    }
    class Source extends Node {
    }
    class Transformer extends Node {
    }
    class Sink extends Node {
    }
    function noop(): void;
    function init(...nodes: Array<Node>): void;
}
export default Gustav;
