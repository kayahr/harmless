---
title: Signals
---

# Signals

Signals are a basic concept for reactive user interfaces and are used by many modern web frameworks. While other frameworks come with a deeply integrated signal system which only works within that specific framework, Harmless uses the standalone [@kayahr/signal](https://www.npmjs.com/package/@kayahr/signal) implementation. These signals are not tied to Harmless and can also be used in any other TypeScript or JavaScript code.

## Writable Signals

The component in this example shows a counter which increases every time the button is pressed:

```tsx
import { createSignal } from "@kayahr/signal";

export function Counter() {
    const [ count, setCount ] = createSignal(0);
    const increment = () => setCount(value => value + 1);

    return <>
        <div>Count: {count}</div>
        <button on:click={increment}>Increment</button>
    </>;
}
```

`createSignal` creates a writable signal containing a numeric value initialized to zero. It returns the two functions `count` and `setCount`. Calling `count()` reads the current value. Calling `setCount(5)` stores a new value, while `setCount(value => value + 1)` calculates it from the previous one.

The `count` function can also be passed directly as JSX content. Harmless calls it to retrieve the current value and automatically tracks the signal dependency. In this example the text node inside the `div` is replaced whenever `setCount` changes the value. The `Counter` component itself is not called again.

Signals can be used in the same way for intrinsic element properties:

```tsx
const [ name, setName ] = createSignal("Arthur");

return <input value={name} aria-label={() => `Edit ${name()}`} />;
```

Here `value` always reflects the signal. The inline function for `aria-label` reads the same signal and derives a different value from it.

## Memos

Another important signal type is the memo, created with `createMemo`. A memo is a read-only signal which uses a function to calculate its value. The remarkable part is that this function can read other signals and automatically tracks them as dependencies.

More precisely, a memo is invalidated when one of its dependencies changes. The next read recalculates and caches the value until another dependency changes. Dependencies are dynamic and correspond to the signals read during the most recent calculation.

The following example uses a memo to transform the value of a writable signal to uppercase:

```tsx
import { createMemo, createSignal } from "@kayahr/signal";

export function Name() {
    const [ name, setName ] = createSignal("Arthur");
    const upperCaseName = createMemo(() => name().toUpperCase());

    return <>
        <div>Name: {upperCaseName}</div>
        <button on:click={() => setName("Tricia")}>Change name</button>
    </>;
}
```

Functions used as JSX children or intrinsic properties are already tracked by Harmless, so a separate memo is not necessary for every derived value. The following style property updates whenever `textColor` changes:

```tsx
export function HelloWorld() {
    const [ textColor, setTextColor ] = createSignal("red");

    return <button
        style={() => ({ color: textColor() })}
        on:click={() => setTextColor("blue")}
    >
        Hello World
    </button>;
}
```

Alternatively you can create the memo yourself when the value is expensive to calculate, is used more than once or is also needed outside JSX:

```tsx
export function HelloWorld() {
    const [ textColor, setTextColor ] = createSignal("red");
    const style = createMemo(() => ({ color: textColor() }));

    return <button style={style} on:click={() => setTextColor("blue")}>
        Hello World
    </button>;
}
```

A memo created while a component is rendered belongs to that component. Harmless disposes it when the component is disposed, so it unsubscribes from its dependencies and can no longer be read.

## Effects

Effects are intended for side effects which cannot be expressed as rendered DOM. `createEffect` runs its function immediately, tracks the signals read during that execution and runs it again synchronously when one of them changes:

```tsx
import { createEffect, createSignal } from "@kayahr/signal";

function Selection() {
    const [ selectedId, setSelectedId ] = createSignal<string | null>(null);

    createEffect(({ onCleanup }) => {
        const id = selectedId();
        document.title = id == null ? "No selection" : `Selected ${id}`;
        onCleanup(() => {
            document.title = "Application";
        });
    });

    return <button on:click={() => setSelectedId("arthur")}>Select Arthur</button>;
}
```

An effect can register cleanup functions which run before the next execution and when the effect is disposed. Effects created while rendering a component are automatically disposed with that component. For visible DOM updates, JSX expressions are normally simpler than effects.

## Asynchronous Resources

`createResource` represents asynchronous work as reactive state. The following component reloads a user whenever its `id` signal changes and renders the current resource state:

```tsx
import { ResourceStatus, createResource } from "@kayahr/signal";

interface User {
    name: string;
}

function UserName({ id }: { id: () => number }) {
    const [ user, resource ] = createResource(id, async (userId, abortSignal) => {
        const response = await fetch(`/api/users/${userId}`, { signal: abortSignal });
        return await response.json() as User;
    });

    return () => {
        switch (resource.status()) {
            case ResourceStatus.Loading:
                return <span>Loading...</span>;
            case ResourceStatus.Failed:
                return <span role="alert">{resource.error()?.message}</span>;
            case ResourceStatus.Ready:
                return <span>{user()?.name}</span>;
            default:
                return null;
        }
    };
}
```

The resource exposes its status, error and value through signals. Updating them reruns the returned JSX function. A resource created while rendering a component is disposed with that component, aborting active loads and preventing stale results from updating removed content.

## Ownership

Harmless creates an ownership scope for every component and every replaceable reactive subtree. Memos, effects and resources register with the active scope when they are created synchronously and are disposed together with it.

Signals created outside a component are owned by the application. Dispose associated effects, memos or resources through their handles or through an explicit `@kayahr/scope` scope when the application no longer needs them.

See the complete [`@kayahr/signal` documentation](https://kayahr.github.io/signal/) for equality configuration, batching, array signals, resources, effects, promise and observable integration and explicit scopes.
