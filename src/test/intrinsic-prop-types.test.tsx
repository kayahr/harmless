/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import "./dom.ts";
import { describe, it } from "node:test";
import { Observable } from "@kayahr/observable";

describe("intrinsic property types", () => {
    it("types standard HTML intrinsic properties and attribute fallbacks", () => {
        const dummy = () => {
            <canvas width={300} height={() => 150} class="chart" data-count={5} data-checked={true} aria-label="Chart" aria-hidden={true} />;
            <input id="name" value="test" checked={true} tabIndex={0} />;
            <div role="tooltip" textContent="Hello" xml:lang="en" />;
            <label for="name">
                Name
                <input id="name" />
            </label>;
            <canvas width={Promise.resolve(300)} />;
            <input checked={new Observable<boolean>(() => undefined)} />;
            <input value={() => Promise.resolve(new Observable<string>(() => undefined))} />;
            <div>{Promise.resolve(new Observable<string>(() => undefined))}</div>;
            <div class={[ "card", false, null, undefined, [ "large", { active: true, disabled: false } ] ]} />;
            <div class={() => [ "card", { active: true } ]} />;
            <div class={Promise.resolve([ "card", { active: true } ])} />;

            // @ts-expect-error Canvas width is a numeric DOM property, not a string attribute.
            <canvas width="300" />;
            // @ts-expect-error Asynchronous canvas width values must still resolve to numbers.
            <canvas width={Promise.resolve("300")} />;
            // @ts-expect-error checked is a boolean DOM property.
            <input checked="yes" />;
            // @ts-expect-error Class-map values must be booleans.
            <div class={{ value: 1 }} />;
            // @ts-expect-error A number is not a CSS class value.
            <div class={123} />;
            // @ts-expect-error True cannot name a CSS class outside a class map.
            <div class={true} />;
            // @ts-expect-error for is a text-like attribute, not a boolean presence attribute.
            <label for={true}>
                Broken
                <input />
            </label>;
            // @ts-expect-error on:* remains reserved for event listeners.
            <button on:click="nope" />;
            // @ts-expect-error Plain onclick is not part of the Harmless intrinsic contract.
            <button onclick={() => {}} />;
        };
        void dummy;
    });

    it("keeps SVG and MathML broad while retaining typed refs", () => {
        const dummy = () => {
            <svg viewBox="0 0 10 10">
                <circle cx="5" cy="5" r={4} />
                <use xlink:href="#dot" />
            </svg>;
            <math display="block">
                <mi>x</mi>
            </math>;
        };
        void dummy;
    });
});
