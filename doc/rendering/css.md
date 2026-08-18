---
title: CSS
---

# CSS

Harmless deliberately does not process, scope or bundle CSS. Use plain stylesheets, CSS modules, a utility library or any other CSS workflow supported by your build system. Harmless only provides convenient ways to set classes and inline styles on intrinsic elements.

## Classes

Static classes are written with the normal HTML `class` property:

```tsx
<article class="card featured">Content</article>
```

Applications often have to combine several conditional class names. Instead of building the complete string manually, pass an array containing strings, Boolean maps and more nested arrays:

```tsx
<article class={[
    "card",
    { featured: true },
    [ "interactive" ]
]}>Content</article>
```

Harmless recursively flattens this value. Strings are copied to the resulting class list, object keys are included when their Boolean value is true and `false`, `null` and `undefined` entries are ignored.

When classes depend on signals, wrap the complete class value in a function:

```tsx
<article class={() => [
    "card",
    selected() && "selected",
    { disabled: disabled() }
]}>Content</article>
```

Harmless tracks the signals read by this function and flattens its complete result again whenever one of them changes. Values nested in the returned arrays and objects are not reactive on their own. The outer function makes the complete class definition reactive.

## Inline Styles

The `style` property accepts either a CSS string or an object containing individual CSS properties:

```tsx
<div style="display: grid; gap: 1rem">Static</div>
```

Wrap the value in a function to update it from signals:

```tsx
<div style={() => ({
    color: active() ? "green" : "gray",
    "font-weight": active() ? 700 : 400,
    "--item-count": items().length
})}>
    Reactive
</div>
```

Object keys are passed to `CSSStyleDeclaration.setProperty`, so use CSS names like `background-color` instead of JavaScript names like `backgroundColor`. CSS custom properties such as `--accent` work in the same way. String and numeric values are converted to text. `null` and `undefined` clear the corresponding property.

Every object update replaces the previous inline style object instead of merging with it. Returning `null`, `undefined` or `false` for the complete `style` value removes the style attribute.

## See Also

* [HTML, SVG and MathML](./intrinsic-elements.md)
* [Reactive Content](./reactive-content.md)
