---
title: HTML, SVG and MathML
---

# HTML, SVG and MathML

Lowercase JSX names are intrinsic elements. Instead of calling a component, Harmless creates the corresponding native DOM element. You can therefore use normal HTML, SVG and MathML directly without a Harmless wrapper around it.

Harmless automatically selects the correct DOM namespace and keeps it across components and reactive content nested inside SVG or MathML.

## HTML Properties and Attributes

HTML elements expose many values as live DOM properties. When a JSX property name matches a writable property on the element, Harmless assigns the value directly to it:

```tsx
import { createSignal } from "@kayahr/signal";

const [ name, setName ] = createSignal("Arthur");
const [ accepted, setAccepted ] = createSignal(false);

return <form>
    <input value={name} />
    <input type="checkbox" checked={accepted} />
    <button type="button" on:click={() => {
        setName("Tricia");
        setAccepted(true);
    }}>
        Change values
    </button>
</form>;
```

This rule applies to all writable HTML DOM properties. In the example it ensures that changing the signals updates the live `value` and `checked` state instead of only changing an HTML attribute.

Hyphenated names like `data-user-id` are written as attributes. Unknown names and values which cannot be assigned as DOM properties also fall back to attributes.

For normal attributes, `null`, `undefined` and `false` remove the attribute, while `true` creates a presence attribute. This matches attributes like `hidden`, where the presence itself represents true.

ARIA attributes use a different Boolean convention. Harmless writes both `true` and `false` as the strings `"true"` and `"false"`. Only `null` and `undefined` remove an `aria-*` attribute:

```tsx
<button aria-expanded={expanded} aria-controls="details">Details</button>
```

The normal HTML `class` property supports the class composition described in [CSS].

## SVG

An `svg` element establishes the SVG namespace for itself and all its descendants. This also works when descendants are returned by components or reactive functions:

```tsx
function Dot(props: { x: () => number; color: () => string }) {
    return <circle cx={props.x} cy="10" r="4" fill={props.color} />;
}

function Chart() {
    const [ x, setX ] = createSignal(10);
    const [ color, setColor ] = createSignal("royalblue");

    return <svg viewBox="0 0 100 20" aria-label="Position">
        <line x1="0" y1="10" x2="100" y2="10" stroke="gray" />
        <Dot x={x} color={color} />
    </svg>;
}
```

SVG values are normally written as attributes. Reactive values update these attributes. `null`, `undefined` and `false` remove them, while `true` creates an empty presence attribute.

Names beginning with `xlink:` and `xml:` are written with their correct XML namespace:

```tsx
<svg>
    <defs>
        <circle id="dot" r="4" />
    </defs>
    <use xlink:href="#dot" xml:lang="en" />
</svg>
```

An SVG `foreignObject` switches its children back to the HTML namespace:

```tsx
<svg viewBox="0 0 200 100">
    <foreignObject x="10" y="10" width="180" height="80">
        <div class="card">HTML inside SVG</div>
    </foreignObject>
</svg>
```

## MathML

A `math` element establishes the MathML namespace. Elements returned by components or reactive content nested below it are created in the MathML namespace:

```tsx
<math display="block">
    <mrow>
        <mi>x</mi>
        <mo>=</mo>
        <mn>{value}</mn>
    </mrow>
</math>
```

## Custom Elements

Existing autonomous custom elements can be used directly in JSX. Their names contain a hyphen, so Harmless and TypeScript can distinguish them from standard HTML elements:

```tsx
<user-card user-id="42" on:select={handleSelect} />
```

Their generic JSX type is based on `HTMLElement`. Properties, attributes and events use the normal browser behavior of the custom element.

Harmless does not provide an API for creating or registering Web Components and Harmless components are not custom elements. Harmless can, however, [render content inside a Web Component](../rendering.md#usage-in-web-components).

[CSS]: ./css.md
