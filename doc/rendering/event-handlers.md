---
title: Event Handlers
---

# Event Handlers

To listen for an event on an HTML, SVG, MathML or custom element, add a property whose name starts with `on:` followed by the native event name:

```tsx
function SaveButton() {
    return <button on:click={event => {
        const button = event.currentTarget as HTMLButtonElement;
        button.disabled = true;
    }}>
        Save
    </button>;
}
```

In this example Harmless registers the function as a normal `click` event listener on the button. The part after `on:` is passed unchanged to `addEventListener`, so custom event names work in exactly the same way:

```tsx
<my-editor on:document-change={handleDocumentChange} />
```

Harmless uses the explicit `on:` prefix because all other function-valued properties on intrinsic elements are reactive. This makes it unambiguous whether a function is an event listener or calculates a property value:

```tsx
<button on:click={save} disabled={() => !canSave()}>Save</button>
```

Plain properties like `onclick` are therefore not part of the Harmless JSX contract. Always use the `on:click` form.

## Native Events

Harmless registers native DOM event listeners. It does not wrap events, create synthetic events or provide event modifiers. Use normal event methods like `preventDefault` and `stopPropagation` inside the listener:

```tsx
<form on:submit={event => {
    event.preventDefault();
    save();
}}>
    <button>Save</button>
</form>
```

The event listener belongs to the intrinsic element. Harmless removes it automatically when that element is disposed.

## Component Event Properties

Properties passed to components are not interpreted by Harmless. A component can choose any name for its callback properties and forward the function to an intrinsic element itself:

```tsx
interface SaveButtonProperties {
    onSave(): void;
}

function SaveButton({ onSave }: SaveButtonProperties) {
    return <button on:click={onSave}>Save</button>;
}

function App() {
    return <SaveButton onSave={() => console.log("Saved")} />;
}
```

`onSave` is an ordinary component property in this example. Only `on:click` on the native button registers a DOM event listener.

## See Also

* [Reactive Content](./reactive-content.md)
* [Component Lifecycles](../components/component-lifecycles.md)
