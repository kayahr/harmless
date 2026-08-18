---
title: Components
children:
    - ./components/class-components.md
    - ./components/component-lifecycles.md
    - ./components/dependency-injection.md
    - ./components/built-in-components.md
---

# Components

Components are written as simple functions or as [class components]. Both are equal in functionality, so use whatever coding style you prefer. The examples in this documentation concentrate on functions, but the shown concepts also work with classes.

Component names should always start with an uppercase letter, like `Contact` and `ToggleButton`, because lowercase element names are reserved for normal HTML, SVG and MathML elements like `div`, `svg` and `math`. These are also called intrinsic elements in the JSX world.

## Basics

The most basic form of a component is a function without parameters which just returns static content:

```tsx
export function HelloWorld() {
    return <h1>Hello World</h1>;
}
```

Other components can now import this component and use it in their own templates:

```tsx
import { HelloWorld } from "./HelloWorld.js";

export function App() {
    return <div><HelloWorld /></div>;
}
```

A component function is called exactly once for each component instance. Signals used in the returned JSX update their specific DOM content without calling the whole component function again.

## Properties

Properties are passed as a plain object in the first function argument, or the first constructor argument when using classes. When a component does not declare such an argument, it does not accept any properties.

The following example shows a `Contact` component with the two properties `firstName` and `lastName`:

```tsx
export function Contact(props: { firstName: string; lastName: string }) {
    return <div class="contact">
        <div>First name: {props.firstName}</div>
        <div>Last name: {props.lastName}</div>
    </div>;
}
```

It can be used in other components like this:

```tsx
import { Contact } from "./Contact.js";

export function Contacts() {
    return <div class="contacts">
        <Contact firstName="Tricia" lastName="McMillan" />
        <Contact firstName="Arthur" lastName="Dent" />
    </div>;
}
```

There are no special limitations on component properties. Treat them like a standard object type in TypeScript. Properties can be of any type and may also be optional. You can use destructuring with default values and provide a properties interface to make the component more pleasant to use:

```tsx
interface UserProperties {
    name: string;
    id: number;
    admin?: boolean;
}

function User({ name, id, admin = false }: UserProperties) {
    return <li class="user">{name}#{id}{admin ? " (Admin)" : ""}</li>;
}

function Users() {
    return <ul>
        <User name="root" id={0} admin />
        <User name="arthur" id={1000} />
    </ul>;
}
```

Harmless passes component properties unchanged. Functions, promises and observables therefore remain normal values when passed to a component. They receive special reactive handling only when used as intrinsic element properties or JSX children.

The exported `NoProps` type can be used when an explicit empty properties type is needed, for example when a component has no properties but receives injected dependencies.

## Children

Component children are passed in the `children` property. If the component does not declare this property, then children are not allowed. To accept arbitrary child content, use `JSX.Element`:

```tsx
import type { JSX } from "@kayahr/harmless";

function Bold(props: { children: JSX.Element }) {
    return <b>{props.children}</b>;
}
```

In most cases `children` should be optional because JSX may invoke the component without any child content. The exported `ParentProps` interface provides this common declaration and can be extended with additional properties:

```tsx
import type { ParentProps } from "@kayahr/harmless";

interface PanelProperties extends ParentProps {
    title: string;
}

function Panel({ title, children }: PanelProperties) {
    return <section class="panel">
        <h2>{title}</h2>
        {children}
    </section>;
}
```

For special use cases the type can be narrowed. The following component, for example, expects a list of numbers as children:

```tsx
<Numbers>
    {1}
    {2}
    {3}
</Numbers>
```

JSX treats multiple children differently from a single child or no child at all. The component receives `undefined` when no child is specified, a single `number` when exactly one is specified and a `number[]` when multiple numbers are given. An implementation accepting any number of values, including none, therefore declares them like this:

```tsx
function Numbers({ children }: { children?: number | number[] }) {
    // ...
}
```

The component controls where and whether its children are rendered.

## See Also

* [Class Components](./components/class-components.md)
* [Component Lifecycles](./components/component-lifecycles.md)
* [Dependency Injection](./components/dependency-injection.md)
* [Built-in Components](./components/built-in-components.md)
* [TypeScript's JSX documentation](https://www.typescriptlang.org/docs/handbook/jsx.html)
* [Rendering](./rendering.md)
* [Signals](./signals.md)

[class components]: ./components/class-components.md
