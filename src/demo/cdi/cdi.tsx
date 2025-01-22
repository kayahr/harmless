/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { injectable } from "@kayahr/cdi";
import { signal } from "@kayahr/signal";

import { Show } from "../../main/components/Show.js";
import type { JSX } from "../../main/JSX.js";
import { component } from "../../main/utils/component.js";
import { render } from "../../main/utils/render.js";

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// This example shows how to use dependency injection to connect services to components.

@injectable
class MathService {
    public add(a: number, b: number): number {
        return a + b;
    }
}

class AsyncMathService {
    @injectable
    public static async create(): Promise<AsyncMathService> {
        await sleep(2000);
        return Promise.resolve(new AsyncMathService());
    }

    public add(a: number, b: number): number {
        return a + b;
    }
}

@component({ inject: [ MathService ] })
export class Counter implements JSX.ElementClass {
    public constructor(
        private readonly props: { inc: number },
        private readonly mathService: MathService
    ) {}

    public render(): JSX.Element {
        const count = signal(0);
        const increment = () => { count.update(value => this.mathService.add(value, this.props.inc)); };
        return <div>
            <div>
                Count: {count}
            </div>
            <button onclick={increment}>Increment</button>
        </div>;
    }
}
component(Counter, { inject: [ MathService ] });

export function Counter2(props: { inc: number }, mathService: AsyncMathService): JSX.Element {
    const count = signal(0);
    const increment = () => { count.update(value => mathService.add(value, props.inc)); };
    return <div>
       <div>
            Count 2: {count}
        </div>
        <button onclick={increment}>Increment</button>
    </div>;
}
component(Counter2, { inject: [ AsyncMathService ] });

const shown = signal(true);
const toggle = () => shown.update(shown => !shown);

document.body.appendChild(render(<>
    <Show when={shown}>
      <div><Counter inc={1} /></div>
      <div><Counter2 inc={2} /></div>
    </Show>
    <button onclick={toggle}>Toggle</button>
</>));
