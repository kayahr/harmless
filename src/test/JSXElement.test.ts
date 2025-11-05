/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { JSXElement } from "../main/JSXElement.ts";
import type { Element } from "../main/utils/types.ts";
import { assertInstanceOf, assertSame } from "@kayahr/assert";

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
            assertInstanceOf(first, Function);
            const second = test.render();
            assertSame(second, first);
        });
    });
    describe("createNode", () => {
        it("returns already created node if created before", () => {
            const test = new TestElement();
            const first = test.createNode();
            assertInstanceOf(first, HTMLDivElement);
            const second = test.createNode();
            assertSame(second, first);
        });
    });
});
