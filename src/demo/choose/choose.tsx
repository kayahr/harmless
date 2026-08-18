/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { Choose, Otherwise, When, render } from "@kayahr/harmless";
import { createSignal } from "@kayahr/signal";

function App() {
    const [ value, setValue ] = createSignal(1);

    return <>
        <button on:click={() => setValue(value => value + 1)}>Increment</button>
        <button on:click={() => setValue(value => value - 1)}>Decrement</button>
        <br />
        <Choose>
            <When test={() => value() >= 5}>At least 5</When>
            <When test={() => value() >= 4}>At least 4</When>
            <When test={() => value() >= 3}>At least 3</When>
            <When test={() => value() >= 2}>At least 2</When>
            <When test={() => value() >= 1}>At least 1</When>
            <Otherwise>Less than 1</Otherwise>
        </Choose>
    </>;
}

document.body.appendChild(render(<App />));
