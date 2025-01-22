---
title: Class Components
---

# Writing a class component

And here is the same component written as a class:

```typescript
export interface ContactProperties {
    firstName: string;
    lastName: string;
}

export class Contact {
    public constructor(private readonly props: ContactProperties) {}

    public render() {
        return <div class="contact">
            <div>First name: {this.props.firstName}</span>
            <div>Last name: {this.props.lastName}</span>
        </div>;
    }
}
```

If you prefer explicit return types and prefer specifying the implemented interface you can use the `JSX.Element` and `JSX.ElementClass` types:

```typescript
import { JSX } from "@kayahr/harmless";

export class Contact implements JSX.ElementClass {
    ...
    public render(...): JSX.Element {
        ...
    }
    ...
}
```
