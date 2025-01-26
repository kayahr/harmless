/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { JSXElement } from "../main/JSXElement.js";
import type { Element } from "../main/utils/types.js";

class TestElement extends JSXElement {
    protected override doRender(): Element | Promise<Element> {
        return () => document.createElement("div");
    }
}

describe("JSXElement", () => {
    describe("render", () => {
        it("returns already created element if rendered before", () => {
            const test = new TestElement();
            const first = test.render();
            expect(first).toBeInstanceOf(Function);
            const second = test.render();
            expect(second).toBe(first);
        });
    });
    describe("createNode", () => {
        it("returns already created node if created before", () => {
            const test = new TestElement();
            const first = test.createNode();
            expect(first).toBeInstanceOf(HTMLDivElement);
            const second = test.createNode();
            expect(second).toBe(first);
        });
    });
});
