---
title: Reactive Content
---

# Reactive Content

You can also use functions, [signals], [observables] and [promises] as properties or children to render dynamic/reactive/asynchronous content.

When rendered into the DOM then Promises are awaited to update the content later. Signals and observables are subscribed to update the content continuously when new values are emitted. Functions are simply called to retrieve the actual value. Functions are also tracked for signal dependencies. So when a function reads a signal value then the content generated from the function result is automatically updated when a dependency changes.

You can even nest these types and Harmless will recursively resolve them. For example you can write a function `currentTime` which returns a promise which is later resolved to an observable which will then emit the current time every second. By simply using `{currentTime}` in the JSX template you will end up with an application which shows the current time eventually and updates it every second.

## See Also

* [Signals](../signals.md)

[signals]: https://www.npmjs.com/package/@kayahr/signal
[promises]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[observables]: https://github.com/tc39/proposal-observable
