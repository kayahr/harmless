---
title: If
---

# If

The `If` component conditionally renders its children. Its `test` property can be a static Boolean value or a function returning one:

```tsx
import { If } from "@kayahr/harmless";

<If test={hasSession}>
    <Dashboard />
</If>
```

When `hasSession` is a signal getter (which is already a function), it can be passed directly. Harmless tracks it and adds or removes the `Dashboard` whenever the signal changes.

## Else Content

Use the `else` property to render different content while the test is false:

```tsx
<If test={hasSession} else={<Login />}>
    <Dashboard />
</If>
```

When `else` is omitted, a false test renders nothing. Both branches can contain fragments, components and every other value supported as JSX content.

A static test selects its branch immediately. A function is evaluated reactively, so it may also combine several signals:

```tsx
<If test={() => user() != null && !loading()}>
    <Dashboard />
</If>
```

## Component Lifetimes

Harmless only renders the currently selected branch. When the condition changes, it disposes the previous branch before rendering the new one:

```tsx
const [ editing, setEditing ] = createSignal(false);

return <If test={editing} else={<ReadOnlyView />}>
    <Editor />
</If>;
```

Changing `editing` from true to false disposes the `Editor` and creates a new `ReadOnlyView`. Changing it back creates a new `Editor`. Hidden component instances are not cached. Memos, effects, resources, listeners and refs belonging to the removed branch are disposed with it.

## See Also

* [Choose]
* [Component Lifecycles]

[Choose]: ./choose.md
[Component Lifecycles]: ../component-lifecycles.md
