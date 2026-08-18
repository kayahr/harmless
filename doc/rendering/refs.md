---
title: Refs
---

# Refs

Normally an application does not need direct access to the DOM elements created by Harmless. Sometimes it is necessary, for example to focus an input element or call a browser API which is only available on the element itself. The `ref` property stores such an element in a signal.

Pass the setter returned by `createSignal` to `ref`:

```tsx
import { createSignal } from "@kayahr/signal";

function Search() {
    const [ input, setInput ] = createSignal<HTMLInputElement | null>(null);

    return <form on:submit={event => {
        event.preventDefault();
        input()?.focus();
    }}>
        <input ref={setInput} type="search" />
        <button>Focus search</button>
    </form>;
}
```

The signal is initialized with `null` because the input does not exist before the component is rendered. Harmless calls `setInput` with the created `HTMLInputElement` while rendering the intrinsic element. The element may therefore already be available before the complete rendered root has been inserted into the document.

## Types

TypeScript derives the expected signal setter type from the intrinsic element name. An `input` ref receives `HTMLInputElement | null`, a `canvas` ref receives `HTMLCanvasElement | null`, an `svg` ref receives `SVGSVGElement | null` and a `math` ref receives `MathMLElement | null`.

Passing a setter for the wrong element type is a compile-time error. Autonomous custom elements use `HTMLElement` because Harmless cannot know the concrete class registered by the application.

## Lifetime

The ref follows the lifetime of its intrinsic element. Harmless calls the setter with `null` when the element is disposed. Switching an `If` branch or replacing reactive content therefore clears refs from the removed branch and assigns refs belonging to the new branch.

Disposing the rendered root clears every ref in the tree. Removing a root node with a plain DOM operation does not dispose it automatically, so dispose the ownership handle as described in [Rendering].

## See Also

* [Rendering]
* [Component Lifecycles]

[Component Lifecycles]: ../components/component-lifecycles.md
[Rendering]: ../rendering.md
