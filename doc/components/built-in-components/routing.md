---
title: Routing
---

# Routing

Harmless provides a small hash-based router for applications which do not need a separate routing library. The `Routes` component watches the part of the browser URL after `#` and renders the first direct `Route` child whose `path` matches it.

The following example provides a home page and a page for individual users:

```tsx
import { A, Route, Routes, routeParams } from "@kayahr/harmless";

function User() {
    return <h1>User {() => routeParams().id}</h1>;
}

export function App() {
    return <>
        <nav>
            <A href="/" activeClass="active">Home</A>
            <A href="/users/42" activeClass="active">User 42</A>
        </nav>
        <Routes>
            <Route path="/">Home</Route>
            <Route path="/users/:id"><User /></Route>
        </Routes>
    </>;
}
```

The paths `/` and `/users/42` correspond to the browser hashes `#/` and `#/users/42`. A missing leading slash in either a route path or the current hash is added automatically.

Following an `A` link, assigning `location.hash` or otherwise changing the browser hash updates `Routes` automatically. Only the selected route is rendered. When a different route becomes active, the previous branch and its components are disposed.

## Route Parameters

A path segment beginning with `:` captures a route parameter. Add `?` to make the complete segment optional:

```tsx
<Route path="/users/:id/:tab?"><User /></Route>
```

The hash `#/users/Arthur%20Dent/settings` produces the parameters `{ id: "Arthur Dent", tab: "settings" }`. With the hash `#/users/42`, the optional `tab` parameter is not present and reads as `undefined`.

The global `routeParams()` signal contains the parameters of the currently active route:

```tsx
function User() {
    return <p>User ID: {() => routeParams().id}</p>;
}
```

Every parameter has the type `string | undefined`. The available names and which parameters are optional depend on the application route and only become known at runtime, so Harmless does not pretend to provide a more specific compile-time type.

When only the parameter values of the same `Route` change, Harmless keeps that route branch and updates the signal. Selecting a different `Route` disposes the old branch.

`routeParams()` is global because a browser document has one current hash and therefore one active route. Use one `Routes` component for the application's route selection.

## Wildcard Parameters

A final path segment beginning with `*` matches the complete remaining path, including additional slash-separated segments. Add a name after `*` to expose the captured remainder as a route parameter:

```tsx
<Route path="/files/*path"><File /></Route>
```

This route matches `/files`, `/files/images` and `/files/images/logo.svg`. The last path produces `{ path: "images/logo.svg" }`, while `path` is `undefined` when `/files` has no remaining path. Wildcard values are URL-decoded like other route parameters.

An anonymous `*` performs the same match without adding a parameter. It is useful as the final route for rendering a fallback page:

```tsx
<Routes>
    <Route path="/">Home</Route>
    <Route path="*">Page not found</Route>
</Routes>
```

A wildcard must be the final path segment. Because `Routes` selects the first matching route, declare a general fallback after all more specific routes.

## Route Matching

A route path must match the complete hash path. Literal characters are matched literally and required parameters must contain at least one character. When several routes could match, their declaration order decides which one is selected.

Only direct `Route` children are considered. `Route` acts as a marker for `Routes` and does not perform navigation by itself.

## Navigation Links

`A` renders a normal anchor element whose `href` points to the corresponding hash. Use `activeClass` and `inactiveClass` to select its class based on whether the link currently matches:

```tsx
<A href="/settings" activeClass="active" inactiveClass="inactive">
    Settings
</A>
```

Checking whether a link is active never changes the parameters exposed by `routeParams()`.

## See Also

* [Component Lifecycles](../component-lifecycles.md)
* [CSS](../../rendering/css.md)
