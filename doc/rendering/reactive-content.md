---
title: Reactive Content
---

# Reactive Content

Functions, [signals], [observables] and [promises] can be used as intrinsic element properties or children to render dynamic, reactive and asynchronous content.

When rendered into the DOM, promises are awaited to update the content later. Signals and observables are observed to update the content whenever their value changes. Functions are called to retrieve their actual value and are automatically tracked for signal dependencies. When a function reads a signal, Harmless updates the content generated from that function whenever the dependency changes.

These types can even be nested and Harmless resolves them recursively. For example, a function can return a promise which later resolves to an observable which then emits another signal. Using that function in JSX is enough to render the eventual value and all later updates.

## Signals and Functions

The getter returned by `createSignal` can be used directly as JSX content:

```tsx
import { createSignal } from "@kayahr/signal";

function Greeting() {
    const [ name, setName ] = createSignal("Arthur");

    return <div>
        <p>Hello {name}</p>
        <button on:click={() => setName("Tricia")}>Change name</button>
    </div>;
}
```

Harmless calls `name`, tracks the signal and replaces the text in the `p` element when `setName` changes it. The `Greeting` component itself is not called again.

Do not call the getter in the JSX child position as `{name()}`, as you might in SolidJS. This resolves the signal while `Greeting` is being called and passes only its current value to Harmless. The connection to the signal is then lost, so later changes cannot update the text. Pass the getter directly as `{name}`, or wrap more complex expressions in a function such as `{() => "Hello " + name()}`.

Use a [computed signal](../signals.md#computed-signals) for derived content or conditional subtrees. A computed signal is an ordinary function, so it can be declared separately or written inline:

```tsx
const [ count, setCount ] = createSignal(0);

return <>
    <p>{() => `The count is ${count()}`}</p>
    {() => count() === 0 ? <em>Nothing counted yet</em> : null}
    <button on:click={() => setCount(value => value + 1)}>Increment</button>
</>;
```

When a function produces a different subtree, Harmless disposes the previous subtree before inserting the new one. Components, memos, effects, resources, listeners and refs owned by the old subtree therefore stop running.

## Promises and Observables

Promises and subscribable observables work both as JSX children and as intrinsic element properties:

```tsx
const name = fetch("/api/name").then(response => response.text());

return <p title={name}>Hello {name}</p>;
```

Harmless converts promises and observables to signals and applies the same recursive resolution to every emitted value. A signal may return a promise, a promise may resolve to an observable and that observable may emit another signal.

Until a promise resolves or an observable emits its first value, its value is `undefined`. As child content this renders nothing. For intrinsic properties the normal handling for `undefined` applies. When an outer reactive value switches to a different promise or observable, Harmless disposes the previous conversion.

## Reactive DOM Properties

Function values on intrinsic elements are reactive functions, except for [event handlers](./event-handlers.md) using the explicit `on:*` syntax:

```tsx
const [ name, setName ] = createSignal("Arthur");
const [ selected, setSelected ] = createSignal(false);

return <input
    value={name}
    checked={selected}
    aria-label={() => `Edit ${name()}`}
    class={() => selected() ? "selected" : null}
/>;
```

Harmless applies the resolved value using the normal property and attribute rules. All writable HTML DOM properties and all HTML, SVG and MathML attributes can therefore be updated reactively. The exact rules are described in [HTML, SVG and MathML](./intrinsic-elements.md).

Component properties are different: Harmless passes them to the component unchanged. A component can therefore accept callbacks, render functions, signals, promises or observables and decide for itself how to use them.

## See Also

* [Signals](../signals.md)
* [Component Lifecycles](../components/component-lifecycles.md)

[observables]: https://www.npmjs.com/package/@kayahr/observable
[promises]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[signals]: https://www.npmjs.com/package/@kayahr/signal
