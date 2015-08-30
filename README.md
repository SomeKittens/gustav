# Gustav

***Status: Developer Preview.  Everything is subject to change without warning.  Some things in this readme may be not technically exist***

Gustav makes realtime data processing simple and modular.


## Concepts

### Workflow

Imagine a Gustav flow as a directed, acyclic graph.  `Source` nodes pull information out of the ether and pass them on to `Transform` nodes that process our data.  Ultimately, the data is outputted via `Output` nodes.  Gustav supports multiple inputs and outputs, so your app may look something like:

```
s1 --- t2 --- o2

s2 -- \
       t1 --- t2 --- o1
s3 -- /
```

Each node implements a `run` method.  If `run` returns an Observable (`Source` and `Transform` nodes), it will be passed on to any nodes that require it.

### Dependencies

Each node in Gustav is connected via a static `dependencies` property or method.  The dependencies property describes what our current node depends on for incoming data.  Properties should be `Node | Array<Node>`.  Methods return `Node | Array<Node>`.  Methods allow for dynamic requirements at runtime.

#### Using a property
```TypeScript
class MyOutput extends Gustav.Output {
  static dependencies MySource;
  // Rest of class
```

#### Using a method
```TypeScript
class MyTransform extends Gustav.Transform {
  static dependencies () {
    return MySource;
  }
  // Rest of class
```

### Naming

 - Typically, the input observable in `Transform` and `Output` nodes is called `iO`.
 - Nodes do not need the suffix "Transform" or "Source" unless you really want to

## Nodes

Gustav has three types of nodes: `Source`, `Transform`, `Output`

### Source

Source nodes extend `Gustav.Source`.  They should not implement `dependencies` (see [concepts](#Concepts)) as they do not depend on anything.  **Source nodes are the only place Observables should be created.**

Examples:

```TypeScript
// Reads from a file and emits each new line
// For demonstration purposes only, use Gustav.Helpers.FileSource for production use
export class FileSource extends Gustav.Source {
  run() {
    let s = fs.createReadStream('');
    return Rx.Observable.create((o) => {
      s.on('data', (data) => {
        let arr = data
        .toString()
        .split('\n')
        .filter(Boolean)
        .forEach(d => o.onNext(d));
      });

      s.on('end', () => o.onCompleted());
    });
  }
}
```

### Transform

A Transform node (`Gustav.Transform`) takes observable(s), modifies the data in some way (map/filter/buffer/etc) and returns the observable post-transform.

Examples:

```TypeScript
// Flat maps against a promise `getGeoFromIp` that queries an API
class FetchGeo extends gustav.Transformer {
  static dependencies() {
    return SParser;
  }
  run(iO) {
    return iO.flatMap(event => {
      return Rx.Observable.fromPromise(getGeoFromIp(event.src.ip));
    });
  }
}
```

```TypeScript
// Collects all events and emits a digest every second
class Timebox extends gustav.Transformer {
  static dependencies() {
    return Parser;
  }
  run(iO) {
    return iO.bufferWithTime(1000)
    .map(eventArr => {
      return eventArr.reduce((totals, event) => {
        if (!totals[event]) {
          totals[event] = 0;
        }
        totals[event]++
        return totals;
      }, {});
      return totals;
    });
  }
}
```

### Output

Output nodes (`Gustav.Output`), surprisingly, output information.  These are usually dumb pipes.

Examples:

```TypeScript
// Logs output to console
class Log extends gustav.Loader {
  static dependencies() {
    return SomeTransformer;
  }
  run(iO) {
    iO.forEach(o => console.log(o));
  }
}
```

```TypeScript
// Sends output out on a websocket
class WSTimebox extends gustav.Loader {
  static dependencies() {
    return SomeOtherTransformer;
  }
  run(iO) {
    iO.forEach(o => app.io.broadcast('update', o));
  }
}
```

## Helpers

Currently, there is only one helper, which wraps [node-tail](https://github.com/lucagrulla/node-tail) as a Gustav Source.  Configurations are passed to helpers via the constructor (pulled from the `readLogs` example):

```TypeScript
class HTTPFileSource extends helpers.FileSource {
  constructor() {
    super('./httplogs', '\n', {}, true);
  }
}
```


## Examples

Sample apps with Gustav can be found in the `examples` directory.