[GitHub] | [NPM] | [API Doc]

| :warning: This project is currently under construction and missing crucial functionality |
| - |

A minimalistic reactive web frontend framework written in TypeScript.

## Features

* Fine-grained reactive DOM updates via [promises], [observables] and signals using a framework-independent [signal] implementation.
* Based on standard [JSX] using the automatic runtime (aka `react-jsx` mode), so no special transpiler plugin needed.
* Supports dependency injection via a framework-independent [cdi] implementation.
* Provides built-in components for flow control, like [If], [Choose] and [Route].
* It's just a library without any build system requirements. Use whatever you like.
* Easily testable with any JSX-capable testing framework (like [Vitest]).

Some features are intentionally missing to keep Harmless small and focused:

* No server rendering. Harmless is a client-only library.
* No web component support. Should be easy enough to use Harmless inside a web component, though.
* No CLI tools. Harmless is just a library and doesn't dictate how to structure your project or how to work with it.
* No CommonJS support. It's time to leave the stone age behind and use [ESM] everywhere.

## TODO

* Write built-in components like `For` to iterate over collections of data.
* Write documentation

## More

Check out the [documentation].


[API Doc]: https://kayahr.github.io/harmless/modules/_kayahr_harmless.html
[Documentation]: https://kayahr.github.io/harmless/documents/Getting_started.html
[GitHub]: https://github.com/kayahr/harmless
[NPM]: https://www.npmjs.com/package/@kayahr/harmless
[Vitest]: https://vitest.dev/
[signal]: https://www.npmjs.com/package/@kayahr/signal
[cdi]: https://www.npmjs.com/package/@kayahr/cdi
[promises]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[observables]: https://github.com/tc39/proposal-observable
[JSX]: https://www.typescriptlang.org/docs/handbook/jsx.html
[ESM]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
[If]: https://kayahr.github.io/harmless/documents/Control_Flow.If.html
[Choose]: https://kayahr.github.io/harmless/documents/Control_Flow.Choose.html
[Route]: https://kayahr.github.io/harmless/documents/Control_Flow.Route.html
