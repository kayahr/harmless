/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import {  signal } from "@kayahr/signal";

import { Choose, Otherwise, When } from "../../main/components/Choose.js";
import { render } from "../../main/utils/render.js";

function Root() {
    const value = signal(1);

    return <>
        <button onclick={() => value.update(e => e + 1)}>Increment</button>
        <button onclick={() => value.update(e => e - 1)}>Decrement</button>
        <br />
        <Choose>
            <When test={() => value() >= 5}>When 5</When>
            <When test={() => value() >= 4}>When 4</When>
            <When test={() => value() >= 3}>When 3</When>
            <When test={() => value() >= 2}>When 2</When>
            <When test={() => value() >= 1}>When 1</When>
            <Otherwise>Otherwise Text!</Otherwise>
        </Choose>
    </>;
};

document.body.appendChild(render(<Root />));
