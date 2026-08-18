---
title: Built-in Components
children:
    - ./built-in-components/if.md
    - ./built-in-components/choose.md
    - ./built-in-components/for.md
    - ./built-in-components/routing.md
---

# Built-in Components

JSX is JavaScript, so normal conditions, functions and array operations can be used to decide what a component returns. A simple reactive condition can be written as a function, for example:

```tsx
import { createSignal } from "@kayahr/signal";

function App() {
    const [ loggedIn ] = createSignal(false);

    return <main>
        {() => loggedIn() ? <Dashboard /> : <Login />}
    </main>;
}
```

Harmless also provides a small set of ready-made components for common rendering tasks. They make larger templates easier to read and provide the correct lifecycle and list-reuse behavior without requiring application code to manage DOM nodes itself.

* [If](./built-in-components/if.md) - Selects between two branches.
* [Choose](./built-in-components/choose.md) - Selects the first matching `When` branch and falls back to an optional `Otherwise` branch.
* [For](./built-in-components/for.md) - Updates a list while preserving the identity of matching rows.
* [Routes and Route](./built-in-components/routing.md) - Select the first matching route branch from the current URL hash.
* [A](./built-in-components/routing.md#navigation-links) - Renders links for hash navigation and can apply different classes to active and inactive links.
