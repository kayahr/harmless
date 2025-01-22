---
title: Signals
---

# Signals

Signals are a base concept for reactive UIs and most modern web frameworks use them these days. But while other frameworks come with their deeply integrated signal system which only works within this specific web framework, Harmless uses a standalone [signal] implementation which is simply based on [observables] so these signals can be used everywhere.

## Writable signals

The component in this example demonstrates how to show a counter which automatically increases every time you press the *Increment* button:

```typescript
import { signal } from "@kayahr/signal";

export function Counter() {
    const count = signal(0);
    const increment = () => count.update(value => value + 1);

    return <>
        <div>Count: {count}</div>
        <button onclick={increment}>Increment</button>
    </>
);
```

In this example a writable signal (created with the `signal` function) is used as a container for a numeric value, which is initialized to 0. The `set` or `update` method on a writable signal can be used to change the value. The `get` method can be used to read the value.

A signal is also a function which can simply be called to read the current value. So `count()` is equivalent to `count.get()`.

A signal also provides a `subscribe` method compatible to observables so a signal is equivalent to an observable. And Harmless can subscribe to any kind of observable to get updates. And that's what happens in the `div` element in this example. The second text node within this `div` element is automatically replaced with a new text node whenever the signal reports a new value.


## Computed signals

Another important signal type is the *computed signal* which is created with the `computed` function. This is a read-only signal which uses the given function to calculate the signal value. The remarkable thing about computed signals is that this function can use the value of other signals and the signal then automatically tracks these signals as dependencies to update the value whenever a dependency changes. Or technically more correct: the computed signal is invalidated when a dependency changes so the next time the computed signal is read, the value is re-calculated by executing the computed value function and then cached until the computed signal is invalidated again.

The following example shows how to use a computed signal to transform the value of a writable signal to upper-case:

```typescript
import { computed, signal } from "@kayahr/signal";

const name = signal("john");
const upperCaseName = computed(() => name().toUpperCase());

// Initially displays the name JOHN
document.body.appendChild(render(<div>Name: {upperCaseName}</div>));

name.set("jane"); // Displayed name changes from JOHN to JANE
```

Functions used in Harmless JSX templates are always wrapped into computed signals so you can declare reactive style sheets for example:

```typescript
// Initially uses red text color and switches to blue one second later
export function HelloWorld() {
    const textColor = signal("red");
    setTimeout(() => textColor.set("blue"), 1000);

    return <div style={() => ({ color: textColor() })}>Hello World</div>;
}
```

This implicitly wraps the function specified as style value into a computed signal which is then observed to get style updates.

Alternatively you can create this computed signal yourself to keep the JSX template nice and clean:

```typescript
export function HelloWorld() {
    const textColor = signal("red");
    setTimeout(() => textColor.set("blue"), 1000);

    const style = computed(() => ({
        color: textColor()
    }));

    return <div style={style}>Hello World</div>;
}
```

Now the `textColor` signal is tracked by the computed signal `style`, which is also an observable and can be used directly in the template to automatically update the style attribute when the text color changes.

Computed signals are automatically destroyed (unsubscribed) when the component is destroyed. See documentation on component lifecycles for details.

[signal]: https://www.npmjs.com/package/@kayahr/signal
[observables]: https://github.com/tc39/proposal-observable
