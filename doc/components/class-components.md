---
title: Class Components
---

# Class Components

Components can also be written as classes. Properties and injected dependencies are passed to the constructor and a mandatory `render` method returns the created `JSX.Element`.

The `Contact.tsx` example shown previously would look like this when written as a class component:

```typescript
export class Contact {
    public constructor(private readonly props: { firstName: string, lastName: string }) {}

    public render() {
        return <div class="contact">
            <div>First name: {this.props.firstName}</span>
            <div>Last name: {this.props.lastName}</span>
        </div>;
    }
}
```

The lifecycle of a class component is straight-forward: When component is rendered then an instance of the class is created and the `render` method is called immediately and only once.

When component is removed from the DOM then it is destroyed. The component is informed about the destruction by calling the optional `onDestroy` method:

```typescript
export class MyComponent {
    public render() {
        console.log("Component created");
        return <span>Hey, there</span>;
    }

    public onDestroy() {
        console.log("Component destroyed");
    }
}
```

Providing an `onDestroy` method is equivalent to registering a callback with the [onDestroy] function in the `render` method or constructor. Use whatever suites your coding style.

## See Also

* [Component Lifecycles]
* [Dependency Injection]

[onDestroy]: https://kayahr.github.io/harmless/functions/_kayahr_harmless.onDestroy.html
[Component Lifecycles]: ./component-lifecycles.md
[Dependency Injection]: ./dependency-injection.md
