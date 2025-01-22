---
title: Function Components
---

# Writing a function component

The following example shows the component `Contact.tsx` written as a function. It has two input properties (`firstName` and `lastName`):

```typescript
export interface ContactProperties {
    firstName: string;
    lastName: string;
}

export function Contact(props: ContactProperties) {
    return <div class="contact">
       <div>First name: {props.firstName}</span>
       <div>last name: {props.lastName}</span>
    </div>;
}
```

This component can be used within the JSX template of any other component like this:

```typescript
import { Contact } from "./Contact.js";

export function Contacts() {
    return <div class="contacts">
        <Contact firstName="Tricia" lastName="McMillan" />
        <Contact firstName="Arthur" lastName="Dent" />
    </div>;
}
```

You can define the function as an arrow function as well, of course, but all examples in this documentation will use function declarations.

If you prefer explicit return types you can add `JSX.Element` as return type:

```typescript
import { JSX } from "@kayahr/harmless";

export function Contact(...): JSX.Element {
    ...
}
```
