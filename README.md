# Gustav

***Status: Developer Preview.  Everything is subject to change without warning.  Some things in this readme may be not technically exist***

Gustav makes realtime data processing simple and modular.


## Concepts

### Workflow

Imagine a Gustav flow as a directed, acyclic graph.  `Source` nodes pull information out of the ether and pass them on to `Transform` nodes that process our data.  Ultimately, the data is outputted via `Sink` nodes.  Gustav supports multiple inputs and outputs, so your app may look something like:

```
s1 --- t2 --- o2

s2 -- \
       t1 --- t2 --- o1
s3 -- /
```

## Examples

Sample apps with Gustav can be found in the `examples` directory.