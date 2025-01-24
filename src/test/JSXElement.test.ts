/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it, vi } from "vitest";

import { JSXElement } from "../main/JSXElement.js";
import type { Element } from "../main/utils/types.js";

const node = document.createElement("div");

class TestElement extends JSXElement {
    protected override doRender(): Element | Promise<Element> {
        return node;
    }
}

describe("JSXElement", () => {
    it("destroys element before rendering again", () => {
        const test = new TestElement();
        const onDestroy = vi.spyOn(test, "destroy");
        expect(test.render()).toBe(node);
        expect(onDestroy).not.toHaveBeenCalled();
        expect(test.render()).toBe(node);
        expect(onDestroy).toHaveBeenCalledOnce();
    });
    it("destroys element before creating node again", () => {
        const test = new TestElement();
        const onDestroy = vi.spyOn(test, "destroy");
        expect(test.createNode()).toBe(node);
        expect(onDestroy).not.toHaveBeenCalled();
        expect(test.createNode()).toBe(node);
        expect(onDestroy).toHaveBeenCalledOnce();
    });
});
