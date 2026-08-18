---
title: Documentation
children:
    - ./components.md
    - ./rendering.md
    - ./signals.md
---

# Documentation

## Installation

Install Harmless as a dependency in your web application:

```sh
npm install @kayahr/harmless
```

Harmless is written in TypeScript, so it automatically comes with working type definitions.

Harmless uses JavaScript's standard [resource management] mechanism to clean up resources. Current Chrome, Edge and Firefox versions and Node.js 20.5 or newer support the required functionality natively. To support Safari, older browsers or older Node.js versions, install a polyfill like [core-js]. TypeScript applications must include `ESNext.Disposable` in their library configuration so the corresponding types are available.

## Sample Application

Here comes the obligatory *Hello World* sample application:

```tsx
import { render } from "@kayahr/harmless";

function HelloWorld() {
    return <h1>Hello World</h1>;
}

document.body.append(render(<HelloWorld />));
```

The function declares a component called `HelloWorld` which outputs a heading containing the text `Hello World`. This component has no properties, no children and does nothing except return static content, so it is just a simple one-line function. Real components will be more complex, of course.

The last line is the application bootstrap code which renders the `HelloWorld` component into a DOM node and appends it to the document body.

Usually you want to have separate source files for components, like `HelloWorld.tsx`, and another source file, like `app.tsx`, for the bootstrap code which imports the root component and adds it to the DOM. In this simple case all the code is located in the same file. In the end it is up to you how you organize your sources. Harmless does not require any special project layout.

## Usage with TypeScript

The recommended way to use Harmless is TypeScript with its built-in JSX support. All examples in this documentation are written in TypeScript. If you prefer plain JavaScript, ignore the type information in the examples, use `.jsx` and `.js` file extensions instead of `.tsx` and `.ts` and read the next section to learn how to configure JSX without TypeScript.

Enable the automatic JSX runtime in `tsconfig.json` and include the DOM and Disposable type definitions:

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "jsx": "react-jsx",
        "jsxImportSource": "@kayahr/harmless",
        "lib": [ "ES2022", "DOM", "ESNext.Disposable" ]
    }
}
```

Script files containing JSX code must use the `.tsx` file extension. Files without JSX can use the standard `.ts` extension, but also work with `.tsx`.

TypeScript compiles the source files into JavaScript files, so a web packaging tool is normally used to bundle the application and its NPM dependencies. With [esbuild], for example, the following command creates an application bundle, assuming TypeScript compiled the application entry point to `lib/app.js`:

```sh
npx esbuild --bundle --outfile=bundle/app.js lib/app.js
```

Alternatively you can use any other packaging tool, like [Parcel], [Rollup], [Vite] or [Webpack]. No special Harmless plugin is needed and the packaging tool does not even need to know about JSX because the TypeScript compiler has already transformed it.

## Usage with JavaScript

There are many ways to use Harmless and JSX without TypeScript. One proven way is [esbuild] with its automatic JSX runtime, assuming the application entry point is `src/app.jsx`:

```sh
npx esbuild --bundle --jsx=automatic --jsx-import-source=@kayahr/harmless --outfile=bundle/app.js src/app.jsx
```

The same is possible with any other JSX-capable packaging tool or transpiler, including [Babel]. Consult the documentation of the selected tool for details.

## HTML File

The generated JavaScript bundle can now be embedded in an HTML file:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Harmless application</title>
  </head>
  <body>
    <script src="bundle/app.js"></script>
  </body>
</html>
```

Harmless does not have any special requirements for the HTML file. You have full control over the document, the application's bootstrap code and the generation of the JavaScript bundle. You are the boss. Harmless is just a harmless little web framework library.

## Cleanup

The node returned by `render` owns the effects, memos, event listeners, refs and component cleanup callbacks created for that tree. Keep this node and dispose it when the application is no longer needed:

```tsx
import { dispose } from "@kayahr/scope";

const host = document.querySelector("#app")!;
const app = render(<App />);
host.append(app);

// Later:
dispose(app);
host.replaceChildren();
```

The `dispose` function is only a convenience helper. You can call `app[Symbol.dispose]()` directly instead, but `dispose(app)` is easier to read.

Disposal releases the owned resources but intentionally does not remove an already inserted root node from the document. DOM placement remains under application control.

## See Also

* [Components](./components.md)
* [Rendering](./rendering.md)
* [Signals](./signals.md)

[Babel]: https://babeljs.io/
[esbuild]: https://esbuild.github.io/
[Parcel]: https://parceljs.org/
[Rollup]: https://rollupjs.org/
[Vite]: https://vite.dev/
[Webpack]: https://webpack.js.org/
[core-js]: https://www.npmjs.com/package/core-js
[resource management]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Resource_management
