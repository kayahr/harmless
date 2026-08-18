---
title: Class Components
---

# Class Components

Components can also be written as classes. Properties and injected dependencies are passed to the constructor and a mandatory `render` method returns the created `JSX.Element`.

The `Contact` example shown in the [component documentation](../components.md) looks like this when written as a class component:

```tsx
import type { JSX } from "@kayahr/harmless";

interface ContactProperties {
    firstName: string;
    lastName: string;
}

export class Contact {
    public constructor(private readonly props: ContactProperties) {}

    public render(): JSX.Element {
        return <div class="contact">
            <div>First name: {this.props.firstName}</div>
            <div>Last name: {this.props.lastName}</div>
        </div>;
    }
}
```

The lifecycle of a class component is straightforward: When the component is rendered, Harmless creates one instance and calls its `render` method immediately and exactly once. Reactive functions in the returned JSX update their specific DOM content without recreating the instance or calling `render` again.

## Disposal

When Harmless disposes the component, it calls an optional standard `Symbol.dispose` method on the instance:

```tsx
export class Clock {
    readonly #timer: ReturnType<typeof setInterval>;

    public constructor() {
        this.#timer = setInterval(() => {
            console.log("tick");
        }, 1000);
    }

    public render() {
        return <span>Clock is running</span>;
    }

    public [Symbol.dispose](): void {
        clearInterval(this.#timer);
    }
}
```

A component is disposed when reactive content removes its branch or when the rendered root is explicitly disposed. Removing a root node with a plain DOM operation alone cannot notify Harmless, so dispose the ownership handle as described in [Rendering](../rendering.md).

Class components may alternatively receive `ComponentContext` and register cleanup functions with `context.onDispose`. Both mechanisms belong to the same [component lifetime](./component-lifecycles.md). Use whichever one best suits your coding style.

## Dependency Injection

Dependencies follow the properties argument in the constructor. Declare their qualifiers with `component`, either as a normal function call or as a standard ECMAScript class decorator:

```tsx
import { component } from "@kayahr/harmless";

@component([ UserService ])
export class UserName {
    public constructor(props: { id: string }, private readonly users: UserService) {}

    public render() {
        return this.users.getName(this.props.id);
    }
}
```

See [Dependency Injection](./dependency-injection.md) for provider registration, component context and asynchronous dependency resolution.

## See Also

* [Component Lifecycles](./component-lifecycles.md)
* [Dependency Injection](./dependency-injection.md)
