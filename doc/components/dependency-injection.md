---
title: Dependency Injection
---

# Dependency Injection

Components often need services which should not be passed through every component property by hand. Harmless integrates with the standalone [@kayahr/di] library to inject such dependencies into function and class components.

Component properties are always passed as the first function or constructor argument. Injected dependencies follow in the order declared with `component`. When a component has asynchronous dependencies, Harmless materializes it asynchronously after the complete dependency graph has been resolved.

## Basic Usage

The following example defines an injectable service and uses it in a function component:

```tsx
import { injectable } from "@kayahr/di";
import { component } from "@kayahr/harmless";

@injectable
class GreetingService {
    public greet(name: string): string {
        return `Hello ${name}`;
    }
}

function Greeting(props: { name: string }, greetings: GreetingService) {
    return <h1>{greetings.greet(props.name)}</h1>;
}

component(Greeting, [ GreetingService ]);
```

The `injectable` decorator registers `GreetingService` in the shared root scope. This is the normal case and requires no scope setup. The `component` call tells Harmless which dependency belongs to the second function argument. The dependency list is checked against the parameter types and their order. Unfortunately, JavaScript decorators cannot be applied to functions, so function components need this call. [Class Components](./class-components.md) can use `@component` as a decorator instead.

## Registration Without Decorators

Decorators are optional. Register the service with the shared injector instead:

```tsx
import { injector } from "@kayahr/di";

class GreetingService {
    public greet(name: string): string {
        return `Hello ${name}`;
    }
}

injector.setClass(GreetingService);
```

The component definition and rendering code remain unchanged. Both forms register `GreetingService` in the shared root scope.

## Custom Scope

Use a custom scope when the service and its singleton instance should belong to a specific application lifetime:

```tsx
import { injectable } from "@kayahr/di";
import { component, render } from "@kayahr/harmless";
import { createScope } from "@kayahr/scope";

const appScope = createScope();

@injectable({ scope: appScope })
class GreetingService {
    public greet(name: string): string {
        return `Hello ${name}`;
    }
}

function Greeting(props: { name: string }, greetings: GreetingService) {
    return <h1>{greetings.greet(props.name)}</h1>;
}

component(Greeting, [ GreetingService ]);

const app = appScope.run(() => render(<Greeting name="Arthur" />));

// After disposing the application:
appScope.dispose();
```

Running the application's existing `render` call inside `appScope` allows Harmless to resolve dependencies registered in that scope. Disposing the rendered application remains unchanged. Dispose `appScope` afterward to also dispose singleton services owned by it. See the [@kayahr/di documentation] for provider types, injection tokens, lifetimes and nested scopes.

## Component Context

`ComponentContext` is a special dependency provided by Harmless. It allows function and class components to register cleanup code for resources like timers and subscriptions. When a component has no dependency metadata, Harmless automatically supplies `ComponentContext` as its second argument:

```tsx
import type { ComponentContext } from "@kayahr/harmless";

function Notifications(props: { url: string }, context: ComponentContext) {
    const socket = new WebSocket(props.url);
    context.onDispose(() => socket.close());
    return <p>Waiting for notifications</p>;
}
```

No `component` call is needed in this case. Once a dependency list is declared, that list defines every injected argument and must include `ComponentContext` explicitly when the component needs it:

```tsx
import { ComponentContext, component } from "@kayahr/harmless";

function View(props: { id: string }, service: Service, context: ComponentContext) {
    const subscription = service.subscribe(props.id);
    context.onDispose(() => subscription.close());
    return <div>{props.id}</div>;
}

component(View, [ Service, ComponentContext ]);
```

## See Also

* [Component Lifecycles](./component-lifecycles.md)
* [Class Components](./class-components.md)

[@kayahr/di]: https://www.npmjs.com/package/@kayahr/di
[@kayahr/di documentation]: https://kayahr.github.io/di/
