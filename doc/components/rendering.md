---
title: Rendering
---

# Rendering

At some point you have to decide which component is the root component of your application and then you have to write the application's entry point (boot strap code) to render the chosen root component into the document.

Here is an example `app.tsx` file which imports a `HelloWorld` component as root component and appends it to the document body:

```typescript
import { render } from "@kayahr/harmless";
import { HelloWorld } from "./HelloWorld.jsx";

document.body.appendChild(render(<HelloWorld />));
```

The `render` function resolves any kind of `JSX.Element` into a DOM node. What you then do with this DOM node is up to you. You can simply append it to the body like in the example above or maybe you prefer appending it as child to a specific existing node of your choice like this:

```typescript
document.querySelector("#my-app").appendChild(render(<HelloWorld />));
```
