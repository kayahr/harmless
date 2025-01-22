---
title: Components
children:
    - ./components/class-components.md
    - ./components/rendering.md
    - ./components/reactive-content.md
    - ./components/component-lifecycles.md
    - ./components/event-handlers.md
    - ./components/dependency-injection.md
---

# Components

Components are written in form of simple functions or in form of [class components]. Both are equal in functionality so use whatever coding style you prefer. The examples in this documentation concentrates on functions but the shown concepts always also work with classes.

Component names should always be upper-camelcase like `Contact` and `ToggleButton` because lower-case element names are reserved for normal HTML elements like `div`, `span` and all the others (also called intrinsic elements in the JSX world).

## Basics

The most basic form of a component is a function without parameters which just returns
static HTML:

```typescript
export function HelloWorld() {
    return <h1>Hello World<h1>;
}
```

Other components can now import this component and use it in their own template:

```typescript
import { HelloWorld } from "./HelloWorld.js";

export function App() {
    return <div><HelloWorld /></div>;
}
```

## Properties

Properties are passed in as the first function argument (or first constructor argument when using classes) in form of a plain key/value object. When the component doesn't expect such an argument then the component does not allow any properties.

The following example shows the component `Contact.tsx`. It has two properties: `firstName` and `lastName`.

```typescript
export function Contact(props: { firstName: string, lastName: string }) {
    return <div class="contact">
       <div>First name: {props.firstName}</span>
       <div>last name: {props.lastName}</span>
    </div>;
}
```

It can be used in other components like this:

```typescript
import { Contact } from "./Contact.js";

export function Contacts() {
    return <div class="contacts">
        <Contact firstName="Tricia" lastName="McMillan" />
        <Contact firstName="Arthur" lastName="Dent" />
    </div>;
}
```

There are no limitations on component properties. Just treat them as you would treat a standard `object` type in TypeScript. Properties can be of any type and may also be optional. You can also use destructuring with default values and provide a properties interface to make the usage more pleasant:

```typescript
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
        <User name="root" id={0} admin={true} />
        <User name="arthur" id={1000} />
    </ul>
}
```

## Children

Component children are passed as `children` property to a component. If the component does not specify such a property then children are not allowed. So to use children you have to explicitly specify them like this:

```typescript
function Bold(props: { children: JSX.Element }) {
    return <b>{props.children}</b>;
}
```

In most cases you want to use `JSX.Element` as children type to pass through any supported type and any number of children.

For special use-cases the type can be narrowed down. Let's say you write a component which expects a list of numbers as children:

```html
<Numbers>
   {1}
   {2}
   {3}
</Numbers>
```

Note that JSX treats multiple children differently than a single child or no child at all. So you won't get an empty array, an array with one number or an array with multiple numbers. Instead you will get `undefined` when no child is specified, `number` when a single number is specified, and `number[]` when multiple numbers are given. Therefor an implementation accepting any number of values (even none) must be written like this:

```typescript
function Numbers({ children }: { children?: number | number[] }) {
    ...
}
```

## More

* [Class Components]
* [Rendering]
* [Reactive Content]
* [Component Lifecycles]
* [Event Handlers]
* [Dependency Injection]

## Seel also

* [TypeScript's JSX documentation](https://www.typescriptlang.org/docs/handbook/jsx.html)

[signals]: https://www.npmjs.com/package/@kayahr/signal
[promises]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[observables]: https://github.com/tc39/proposal-observable
[Class Components]: ./components/class-components.md
[Rendering]: ./components/rendering.md
[Reactive Content]: ./components/reactive-content.md
[Component Lifecycles]: ./components/component-lifecycles.md
[Event Handlers]: ./components/event-handlers.md
[Dependency Injection]: ./components/dependency-injection.md
