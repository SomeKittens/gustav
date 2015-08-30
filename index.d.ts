/// <reference path="typings/tsd.d.ts" />
declare module Gustav {
    class Node {
        constructor();
        static dependencies(): void;
    }
    class Source extends Node {
    }
    class Transformer extends Node {
        static dependencies(): void;
    }
    class Loader extends Node {
        static dependencies(): void;
    }
    function noop(): void;
    function init(...nodes: Array<Node>): void;
}
export = Gustav;
