---
title: Getting started
---

# Getting started

## Installation

Install Harmless as a dependency in your web application:

```bash
npm install @kayahr/harmless
```

Harmless is written in TypeScript, so it automatically comes with working type definitions.

Note that Harmless is ESM-only. There are no plans to provide a downgraded CommonJS export. If you are using CommonJS in your application then consider upgrading it to modern ESM instead of requiring dependencies to provide a compatibility layer for ancient standards.


## Sample Application

Here comes the obligatory *Hello World* sample application:

```javascript
import { render } from "@kayahr/harmless";

function HelloWorld() {
    return <h1>Hello World</h1>;
}

document.body.appendChild(render(<HelloWorld />));
```

The function declares a component called `HelloWorld` which just outputs a header element containing the text `Hello World`. This component has no properties, no children and does nothing except returning static HTML content, so it's just a simple one-liner function. Real components will be more complex, of course.

The last line is the application boot strap code which renders the `HelloWorld` component into a DOM node and then appends it to the document body.

Usually you want to have separate source files for each component (like `HelloWorld.tsx` or `HelloWorld.jsx`) and another source file (like `app.tsx` or `app.jsx`) for the boot strap code which imports the root component and adds it to the DOM. In this simple case all this code is located in the same file. But in the end it is up to you how you want to organize your sources, Harmless does not require any special project layout.


## Usage with TypeScript

The recommended way to use Harmless is by using TypeScript and its built-in support for JSX. All examples in this documentation are written in TypeScript. If you prefer using plain JavaScript then ignore the type information in the examples, use `.jsx` and `.js` file extensions instead of `.tsx` and `.ts` and read the next documentation section to learn how to use JSX without TypeScript.

To enable JSX support in TypeScript you have to add these two properties to your `tsconfig.json` file:

```json
{
    "jsx": "react-jsx",
    "jsxImportSource": "@kayahr/harmless"
}
```

Script files containing JSX code must have the `.tsx` file extension. Script files not containing JSX code can have the standard `.ts` file extension but will also work with `.tsx`.

As TypeScript compiles the source code (`.ts` and `.tsx` files) into a bunch of JavaScript files you have to use some web packaging tool to bundle all your source files and its NPM dependencies (like Harmless) into a single application bundle. With [esbuild] for example this command will do it (assuming TypeScript compiled your application entry point to `lib/app.js`):

```sh
npx esbuild --bundle --outfile=bundle/app.js lib/app.js
```

Alternatively you can use any other packaging tool, like [Parcel], [Rollup], [Vite] or [Webpack]. Please consult their documentation for details. No special plugins are needed and the packaging tool does not even need to know JSX because the TypeScript compiler already took care of it.


## Usage with JavaScript

There are most likely many ways to use Harmless and JSX without TypeScript. One proven way is using [esbuild] like this (assuming your application entry point is `lib/app.jsx`):

```sh
npx esbuild --bundle --jsx=automatic --jsx-import-source=@kayahr/harmless --outfile=bundle/app.js lib/app.jsx
```

The same should be possible with any other JSX-capable packaging tool or transpiler or by using [Babel]. Please consult their documentation for details.


## HTML file

The created JavaScript bundle can now be embedded in an HTML file like this:

```html
<!DOCTYPE html>
<html>
  <body>
    <script src="bundle/app.js"></script>
  </body>
</html>
```

Note that Harmless does not have any special requirements how you embed the JavaScript code in the HTML file. Do it however you like, you have full control over the HTML file, the application's boot strap code and even the generation of the JavaScript bundle itself. You are the boss, Harmless is just a harmless little web framework library.


[ESbuild]: https://esbuild.github.io/
[Babel]: https://babeljs.io/
[ESbuild]: https://esbuild.github.io/
[Parcel]: https://parceljs.org/
[Rollup]: https://rollupjs.org/
[Vite]: https://vite.dev/
[Webpack]: https://webpack.js.org/
