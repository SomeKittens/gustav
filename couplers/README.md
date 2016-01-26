# Couplers

*This document is intended to describe the spec for building a Gustav coupler.  If you're interested in integrating couplers into your project, see [the main readme.](https://github.com/SomeKittens/gustav/tree/0.7#couplers)*

## Interface

First off, couplers should implement the ICoupler interface:

```typescript

export interface ICoupler {
  config?: any;
  defaultName: string;
  getClient?(): any;
  from(name: string): Observable<any>;
  to(name: string, iO: Observable<any>): Subscription<any>;
}
```

### `config?: any`

The coupler may expose an optional config property of any sort.

### `defaultName`

If the user does not pass in a name, this will be used instead.  Example:

```typescript
let dc = new DemoCoupler();
console.log(dc.defaultName); // 'demo'

gustav.coupler(new DemoCoupler());

gustav.createWorkflow('hello')
  .in('demo', 'hello-in')
  // ...etc
```

This is used behind the scenes in gustav itself when creating the internal-only source/sink nodes.

### `getClient?(): any`

This is used to override the client in unit testing.  Unsure if it'll stay in, we'll see as more couplers get added to the project.  This is used internally with tools that require a new client for every connection (or connection type).

### `from(name: string): Observable<any>`

Given a string, this should connect to the service of choice and open a channel to `name`.  Any events on that channel should be emitted through the returned Observable sequence.

#### Note:

If the string `__done` is passed as an event, then the created observable should be closed (calling `.complete`).

### `to(name: string, iO: Observable<any>): Subscription<any>`

Given a string & Observable, subscribe to the Observable and push any events to the channel on your tool of choice.

#### Note:

Matching the above note, if the subscribed observable is completed, pass the string `__done` to the channel.