/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { signal } from "@kayahr/signal";
import { describe, expect, it } from "vitest";

import { Show } from "../../main/components/Show.js";
import { render } from "../../main/utils/render.js";

describe("Show", () => {
    it("renders children if condition is true", () => {
        const element = Show({
            when: () => true,
            children: [ "is ", true ]
        });
        const node = render(element);
        const root = document.createElement("div");
        root.appendChild(node);
        expect(root.outerHTML).toBe("<div><!--<>--><!--<>-->is true<!--</>--><!--</>--></div>");
    });
    it("renders nothing if condition is false and there is no fallback", () => {
        const element = Show({
            when: () => false,
            children: [ "is ", true ]
        });
        const node = render(element);
        const root = document.createElement("div");
        root.appendChild(node);
        expect(root.outerHTML).toBe("<div><!--<>--><!--</>--></div>");
    });
    it("renders fallback if condition is false", () => {
        const element = Show({
            when: () => false,
            children: [ "is ", true ],
            fallback: [ "is ", false ]
        });
        const node = render(element);
        const root = document.createElement("div");
        root.appendChild(node);
        expect(root.outerHTML).toBe("<div><!--<>--><!--<>-->is false<!--</>--><!--</>--></div>");
    });
    describe("dynamically changes rendering with arrays when condition changes", () => {
        const createTestValues = (condition: boolean) => ({
            "sync array": [ "is ", condition ],
            "async array": Promise.resolve([ "is ", condition ]),
            "sync/async": [ "is ", Promise.resolve(condition) ]
        });
        const children = createTestValues(true);
        const fallbacks = createTestValues(false);
        for (const [ childName, child ] of Object.entries(children)) {
            for (const [ fallbackName, fallback ] of Object.entries(fallbacks)) {
                it(`with ${childName} child and ${fallbackName} fallback`, async () => {
                    const wait = async () => {
                        if (child instanceof Array) {
                            await Promise.all(child);
                        } else {
                            await child;
                        }
                        if (fallback instanceof Array) {
                            await Promise.all(fallback);
                        } else {
                            await fallback;
                        }
                    };
                    const when = signal(true);
                    const element = Show({
                        when,
                        children: child,
                        fallback
                    });
                    const node = render(element);
                    const root = document.createElement("div");
                    root.appendChild(node);
                    await wait();
                    expect(root.outerHTML).toBe("<div><!--<>--><!--<>-->is true<!--</>--><!--</>--></div>");
                    when.set(false);
                    await wait();
                    expect(root.outerHTML).toBe("<div><!--<>--><!--<>-->is false<!--</>--><!--</>--></div>");
                    when.set(true);
                    await wait();
                    expect(root.outerHTML).toBe("<div><!--<>--><!--<>-->is true<!--</>--><!--</>--></div>");
                    when.set(false);
                    await wait();
                    expect(root.outerHTML).toBe("<div><!--<>--><!--<>-->is false<!--</>--><!--</>--></div>");
                });
            }
        }
    });
    describe("dynamically changes rendering with single values when condition changes", () => {
        const createTestValues = (condition: boolean) => ({
            "single sync": `is ${condition}`,
            "single async": Promise.resolve(`is ${condition}`),
            signal: signal(`is ${condition}`),
            "async signal": Promise.resolve(signal(`is ${condition}`))
        });
        const children = createTestValues(true);
        const fallbacks = createTestValues(false);
        for (const [ childName, child ] of Object.entries(children)) {
            for (const [ fallbackName, fallback ] of Object.entries(fallbacks)) {
                it(`with ${childName} child and ${fallbackName} fallback`, async () => {
                    const wait = async () => {
                        if (child instanceof Array) {
                            await Promise.all(child);
                        } else {
                            await child;
                        }
                        if (fallback instanceof Array) {
                            await Promise.all(fallback);
                        } else {
                            await fallback;
                        }
                    };
                    const when = signal(true);
                    const element = Show({
                        when,
                        children: child,
                        fallback
                    });
                    const node = render(element);
                    const root = document.createElement("div");
                    root.appendChild(node);
                    await wait();
                    expect(root.outerHTML).toBe("<div><!--<>-->is true<!--</>--></div>");
                    when.set(false);
                    await wait();
                    expect(root.outerHTML).toBe("<div><!--<>-->is false<!--</>--></div>");
                    when.set(true);
                    await wait();
                    expect(root.outerHTML).toBe("<div><!--<>-->is true<!--</>--></div>");
                    when.set(false);
                    await wait();
                    expect(root.outerHTML).toBe("<div><!--<>-->is false<!--</>--></div>");
                });
            }
        }
    });
    it("dynamically changes rendering between dynamic signals", () => {
        const children = signal("content");
        const fallback = signal("fallback");
        const when = signal(false);
        const element = Show({
            when,
            children,
            fallback
        });
        const node = render(element);
        const root = document.createElement("div");
        root.appendChild(node);
        expect(root.outerHTML).toBe("<div><!--<>-->fallback<!--</>--></div>");
        fallback.set("FALLBACK");
        expect(root.outerHTML).toBe("<div><!--<>-->FALLBACK<!--</>--></div>");
        children.set("CONTENT");
        expect(root.outerHTML).toBe("<div><!--<>-->FALLBACK<!--</>--></div>");
        when.set(true);
        expect(root.outerHTML).toBe("<div><!--<>-->CONTENT<!--</>--></div>");
        when.set(false);
        expect(root.outerHTML).toBe("<div><!--<>-->FALLBACK<!--</>--></div>");
        when.set(true);
        expect(root.outerHTML).toBe("<div><!--<>-->CONTENT<!--</>--></div>");
        children.set("Content");
        fallback.set("Fallback");
        expect(root.outerHTML).toBe("<div><!--<>-->Content<!--</>--></div>");
    });
    it("dynamically switches nested Show components", () => {
        const childA1 = "Child A1";
        const childA2 = "Child A2";
        const childB1 = "Child B1";
        const childB2 = "Child B2";
        const switch1 = signal(true);
        const showA = Show({ when: switch1, children: childA1, fallback: childA2 });
        const switch2 = signal(true);
        const showB = Show({ when: switch2, children: childB1, fallback: childB2 });
        const rootSwitch = signal(true);
        const rootShow = Show({ when: rootSwitch, children: showA, fallback: showB });
        const root = document.createElement("div");
        root.appendChild(render(rootShow));
        expect(root.outerHTML).toBe("<div><!--<>--><!--<>-->Child A1<!--</>--><!--</>--></div>");
        rootSwitch.set(false);
        expect(root.outerHTML).toBe("<div><!--<>--><!--<>-->Child B1<!--</>--><!--</>--></div>");
        switch1.set(false); // Should not affect the DOM yet because showA is not shown yet
        expect(root.outerHTML).toBe("<div><!--<>--><!--<>-->Child B1<!--</>--><!--</>--></div>");
        switch2.set(false);
        expect(root.outerHTML).toBe("<div><!--<>--><!--<>-->Child B2<!--</>--><!--</>--></div>");
        rootSwitch.set(true);
        expect(root.outerHTML).toBe("<div><!--<>--><!--<>-->Child A2<!--</>--><!--</>--></div>");
    });
});
