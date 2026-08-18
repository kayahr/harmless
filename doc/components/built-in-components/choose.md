---
title: Choose
---

# Choose

When a component has more than two possible branches, nested `If` components quickly become difficult to read. `Choose` groups the alternatives as `When` children and renders the first one whose `test` is true:

```tsx
import { Choose, Otherwise, When } from "@kayahr/harmless";

<Choose>
    <When test={loading}>Loading...</When>
    <When test={() => error() != null}>Failed: {() => error()!.message}</When>
    <When test={() => result() != null}><Result value={result} /></When>
    <Otherwise>Nothing selected</Otherwise>
</Choose>
```

Like the `test` property of `If`, a `When` test can be a static Boolean value or a function returning one. Signal getters can be passed directly because they are already functions.

## Selection Order

Harmless checks the `When` branches from top to bottom and stops after the first true test. The order is therefore significant when more than one condition can be true.

Tests after the selected branch are not evaluated. Their signal dependencies are only tracked when all earlier tests are false and Harmless actually has to inspect them.

## Otherwise

The optional `Otherwise` child is rendered when no `When` test matches. If it is omitted, `Choose` renders nothing in this case.

`When` and `Otherwise` are marker components and must be direct children of `Choose`. Put `Otherwise` after the `When` branches so the template reflects the order in which alternatives are considered.

## Component Lifetimes

Only the selected branch is rendered. When a different test becomes the first match, Harmless disposes the old branch before creating the new one. Components and reactive resources from inactive branches are not kept in the background.

## See Also

* [If](./if.md)
* [Component Lifecycles](../component-lifecycles.md)
