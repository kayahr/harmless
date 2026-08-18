---
title: Rendering
children:
    - ./rendering/reactive-content.md
    - ./rendering/intrinsic-elements.md
    - ./rendering/css.md
    - ./rendering/event-handlers.md
    - ./rendering/refs.md
---

# Rendering

At some point you have to decide which component is the root component of your application and write an application entry point which renders it into the document.

Here is an example `app.tsx` file which imports an `App` component as the root component and appends it to the document body:

```tsx
import { render } from "@kayahr/harmless";
import { App } from "./App.js";

document.body.append(render(<App />));
```

The `render` function resolves any kind of `JSX.Element` into a real DOM node. What you do with this node is up to you. You can append it to the body as in the example above, add it to a specific existing element or insert it with any other standard DOM operation:

```tsx
document.querySelector("#my-app")!.append(render(<App />));
```

## Supported Values

Harmless can render all of these values:

* Intrinsic elements and component invocations.
* Strings, numbers, bigint values and booleans, which become text nodes.
* `null` and `undefined`, which produce no visible content.
* DOM nodes, which are used directly without cloning.
* Arrays and JSX fragments, which may contain any supported values recursively.
* Functions and signals, whose returned JSX is tracked and updated reactively.
* Promises and subscribable observables, whose values are resolved recursively.

## Fragments

Fragments group any number of children without adding a wrapper element:

```tsx
function Name() {
    return <>
        <span>Arthur</span>
        {" "}
        <span>Dent</span>
    </>;
}
```

Static fragments nested directly in an element are flattened into normal children. Dynamic ranges retain internal comment anchors so Harmless can replace exactly the nodes it owns without disturbing adjacent DOM.

## Usage in Web Components

Harmless does not provide an API for creating or registering Web Components, but it can render their content. The returned node can be inserted into a custom element's light DOM or shadow DOM like any other DOM node:

```tsx
import { type RenderedNode, render } from "@kayahr/harmless";
import { dispose } from "@kayahr/scope";

class GreetingElement extends HTMLElement {
    readonly #root = this.attachShadow({ mode: "open" });
    #content: RenderedNode | null = null;

    public connectedCallback(): void {
        if (this.#content == null) {
            this.#content = render(<p>Hello from Harmless</p>);
            this.#root.append(this.#content);
        }
    }

    public disconnectedCallback(): void {
        if (this.#content != null) {
            dispose(this.#content);
        }
        this.#content = null;
        this.#root.replaceChildren();
    }
}

customElements.define("harmless-greeting", GreetingElement);
```

This example renders fresh content when the custom element is connected and disposes it when the element is disconnected. Existing custom elements can also be used directly as intrinsic JSX elements, as described in [HTML, SVG and MathML](./rendering/intrinsic-elements.md).

## Disposal and DOM Removal

Disposal stops reactive updates and releases component scopes, event listeners, refs and other owned resources. It intentionally does not remove a single root node which has already been inserted, because Harmless leaves DOM placement under application control:

```tsx
import { dispose } from "@kayahr/scope";

const host = document.querySelector("#app")!;
const node = render(<App />);
host.append(node);

// Later:
dispose(node);
host.replaceChildren();
```

Calling `dispose` on the same node more than once is safe. If cleanup functions fail, Harmless still attempts the remaining cleanup work and then reports the failure.
