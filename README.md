# Harmless

[GitHub] | [NPM] | [API doc]

A minimalistic reactive web frontend framework written in TypeScript.

## Features

* Fine-grained reactive DOM updates via [promises], [observables] and signals using a framework-independent [signal] implementation.
* Based on standard [JSX] using the automatic runtime (aka `react-jsx` mode), so no special transpiler plugin needed.
* Supports dependency injection via a framework-independent [DI] implementation.
* Renders native HTML, SVG and MathML elements with reactive properties, attributes and styles.
* Provides built-in components for flow control, like [If], [Choose] and [Route].
* Provides keyed list rendering with [For].
* It's just a library without any build system requirements. Use whatever you like.
* Easily testable with any JSX-capable testing framework (like [Vitest]).

Some features are intentionally missing to keep Harmless small, focused and... well... harmless:

* No server rendering. Harmless is a client-only library.
* No API for creating Web Components. Harmless components are not custom elements, but Harmless can be used to render their content.
* No CLI tools. Harmless is just a library and doesn't dictate how to structure your project or how to work with it.

## Quick Start

Install Harmless in your application:

```sh
npm install @kayahr/harmless
```

Configure TypeScript's automatic JSX runtime:

```json
{
    "compilerOptions": {
        "jsx": "react-jsx",
        "jsxImportSource": "@kayahr/harmless",
        "lib": [ "ES2022", "DOM", "ESNext.Disposable" ]
    }
}
```

Then render a component and append the returned DOM node:

```tsx
import { render } from "@kayahr/harmless";
import { createSignal } from "@kayahr/signal";

function Counter() {
    const [ count, setCount ] = createSignal(0);

    return <button on:click={() => setCount(value => value + 1)}>
        Clicks: {count}
    </button>;
}

document.body.append(render(<Counter />));
```

See the [documentation] for setup, components, signals, rendering, lifecycle management, built-in components and SVG support.

[API Doc]: https://kayahr.github.io/harmless/
[Documentation]: ./doc/index.md
[GitHub]: https://github.com/kayahr/harmless
[NPM]: https://www.npmjs.com/package/@kayahr/harmless
[Vitest]: https://vitest.dev/
[signal]: https://www.npmjs.com/package/@kayahr/signal
[DI]: https://www.npmjs.com/package/@kayahr/di
[promises]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[observables]: https://www.npmjs.com/package/@kayahr/observable
[JSX]: https://www.typescriptlang.org/docs/handbook/jsx.html
[If]: ./doc/components/built-in-components/if.md
[Choose]: ./doc/components/built-in-components/choose.md
[For]: ./doc/components/built-in-components/for.md
[Route]: ./doc/components/built-in-components/routing.md
