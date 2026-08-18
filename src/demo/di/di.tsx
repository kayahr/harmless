/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { injectable, injector } from "@kayahr/di";
import { If, type JSX, component, render } from "@kayahr/harmless";
import { createSignal } from "@kayahr/signal";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

@injectable
class MathService {
    public add(a: number, b: number): number {
        return a + b;
    }
}

class AsyncMathService {
    public static async create(): Promise<AsyncMathService> {
        await sleep(2000);
        return new AsyncMathService();
    }

    public add(a: number, b: number): number {
        return a + b;
    }
}
injector.setFactory(AsyncMathService, AsyncMathService.create);

@component([ MathService ])
class Counter {
    readonly #props: { increment: number };
    readonly #math: MathService;

    public constructor(props: { increment: number }, math: MathService) {
        this.#props = props;
        this.#math = math;
    }

    public render(): JSX.Element {
        const [ count, setCount ] = createSignal(0);
        return <div>
            <div>Count: {count}</div>
            <button on:click={() => setCount(value => this.#math.add(value, this.#props.increment))}>Increment</button>
        </div>;
    }
}

function AsyncCounter(props: { increment: number }, math: AsyncMathService): JSX.Element {
    const [ count, setCount ] = createSignal(0);
    return <div>
        <div>Async count: {count}</div>
        <button on:click={() => setCount(value => math.add(value, props.increment))}>Increment</button>
    </div>;
}
component(AsyncCounter, [ AsyncMathService ]);

function App() {
    const [ shown, setShown ] = createSignal(true);
    return <>
        <If test={shown}>
            <Counter increment={1} />
            <AsyncCounter increment={2} />
        </If>
        <button on:click={() => setShown(shown => !shown)}>Toggle counters</button>
    </>;
}

document.body.appendChild(render(<App />));
