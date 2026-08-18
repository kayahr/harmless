---
title: For
---

# For

A static array can be rendered with the normal JavaScript `map` method. When a reactive array changes, however, recreating the complete mapped result would also recreate every component in it. The `For` component updates such lists row by row and keeps existing rows whenever their identity is still present.

Its `of` property accepts an array or a signal returning an array:

```tsx
import { For } from "@kayahr/harmless";
import { createSignal } from "@kayahr/signal";

interface User {
    id: number;
    name: string;
}

const [ users, setUsers ] = createSignal<readonly User[]>([]);

return <ul>
    <For of={users} key={user => user.id}>
        {(user, index) => <li>
            {() => `${index() + 1}. ${user().name}`}
        </li>}
    </For>
</ul>;
```

The function passed as child is called once when Harmless creates a row. It receives two functions which return the row's current item and index. Call `user()` and `index()` to read their values, or pass these functions directly to reactive child positions.

When a row is reused after an update, its item or index can change without recreating the component subtree belonging to that row. This is important for rows containing local component state, input elements or other resources which should survive reordering.

`null` and `undefined` behave like an empty array. Rows which are no longer present are disposed immediately.

## Row Identity

The `key` property tells `For` which old row belongs to which new item. There are three useful forms.

When `key` is omitted, the item itself is used as the key. Objects are compared by reference identity and primitive values by their normal map identity. This is convenient when the same object instances remain in the array:

```tsx
<For of={users}>
    {user => <UserRow user={user} />}
</For>
```

When data updates create new objects for the same records, use a function which returns a stable identifier:

```tsx
<For of={users} key={user => user.id}>
    {user => <UserRow user={user} />}
</For>
```

Use `key="index"` when the array position itself is the identity. Each existing slot then keeps its row while its item changes. This is normally not appropriate when local row state should move together with a record.

Keys should be stable and unique within the current array. Duplicate keys are handled deterministically, but make the intended row identity ambiguous and should usually be avoided.

## Updating the List

Whenever the `of` signal changes, `For` matches the new items with the existing rows. Matching rows are reused, changed item and index values are updated, reordered rows are moved and new rows are created. Rows without a match are disposed.

```tsx
const [ tasks, setTasks ] = createSignal([
    { id: 1, label: "Write" },
    { id: 2, label: "Review" }
]);

return <For of={tasks} key={task => task.id}>
    {task => <TaskRow task={task} />}
</For>;
```

In this example `TaskRow` receives the item function as a normal component property. The component can read it wherever the current task is needed.

## See Also

* [Reactive Content](../../rendering/reactive-content.md)
* [Component Lifecycles](../component-lifecycles.md)
