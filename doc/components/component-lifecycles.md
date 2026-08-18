---
title: Component Lifecycles
---

# Component Lifecycles

Most components do not have to care about their lifecycle. They are created when Harmless renders them and disposed when they are no longer part of the rendered tree. Harmless automatically cleans up their memos, effects, resources, event listeners and refs.

A new component instance is created every time a component is added to the tree. When reactive content removes it, the instance is disposed and not kept for later reuse. Adding the same component again creates a new instance.

## Function Component Cleanup

Some components create resources Harmless cannot clean up automatically, like timers or subscriptions to APIs which are not signals. A function component can request its `ComponentContext` and use `onDispose` to register cleanup code:

```tsx
import { type ComponentContext, type NoProps } from "@kayahr/harmless";
import { createSignal } from "@kayahr/signal";

function Clock(props: NoProps, context: ComponentContext) {
    void props;
    const [ time, setTime ] = createSignal(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);

    context.onDispose(() => {
        clearInterval(timer);
    });

    return <time>{() => time().toLocaleTimeString()}</time>;
}
```

Harmless calls the registered cleanup function when the `Clock` component is disposed. Register as many cleanup functions as necessary. Harmless gives all of them a chance to run even when one throws an error.

When a component has no configured dependency injection metadata, Harmless automatically passes `ComponentContext` as the second argument. If the component declares injected dependencies with `component`, then this list defines every injected argument and must contain `ComponentContext` at the corresponding position:

```tsx
component(Clock, [ ComponentContext ]);
```

## Class Component Cleanup

Class components can implement the standard `Symbol.dispose` method instead:

```tsx
class SubscriptionView {
    public render() {
        return <p>Subscribed</p>;
    }

    public [Symbol.dispose](): void {
        // Unsubscribe or release other resources here.
    }
}
```

Harmless calls this method when the class component is disposed. A class constructor can also receive `ComponentContext` when registering cleanup functions there is more convenient.

## Signals and Component Ownership

Memos, effects and resources from `@kayahr/signal` automatically register themselves with the component which creates them. This works when they are created synchronously while Harmless calls the component function, constructor or `render` method.

Reactive child content has its own lifetime. When a function returns a different subtree, Harmless disposes the previous subtree and all signal resources created while rendering it.

Work started later by an untracked timer or after an application-level `await` is no longer created inside the component scope. Register explicit cleanup for such work. Asynchronously injected dependencies are handled by Harmless itself: The component is rendered inside its correct scope after all dependencies have been resolved.

## Root Component Cleanup

The node returned by `render` owns the complete rendered tree. Dispose it with `dispose(node)` from `@kayahr/scope` when the application is no longer needed.

Disposal is safe to call more than once. It releases the owned resources but does not remove an already inserted root node from the DOM. Remove that node separately with a normal DOM operation.

## See Also

* [Class Components](./class-components.md)
* [Rendering](../rendering.md)
* [Dependency Injection](./dependency-injection.md)
