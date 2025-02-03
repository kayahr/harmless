/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import "@kayahr/vitest-matchers";

import { describe, expect, it, vi } from "vitest";

import { IntrinsicElement } from "../main/IntrinsicElement.js";
import { JSXElement } from "../main/JSXElement.js";
import { addNodeReplaceListener, connectElement, destroyElement, replaceNode } from "../main/JSXNode.js";
import { createFragment, dump } from "./support.js";

describe("connectElement", () => {
    it("connects a JSX element to a DOM node", () => {
        const node = document.createElement("div");
        const element = new class extends JSXElement {
            public destroyed = false;
            protected override doRender(): Node {
                throw new Error("Method not implemented");
            }

            public override destroy(): void {
                this.destroyed = true;
                super.destroy();
            }
        }();
        connectElement(node, element);
        expect(element.destroyed).toBe(false);
        destroyElement(node);
        expect(element.destroyed).toBe(true);
    });
    it("returns the given node", () => {
        const node = document.createElement("div");
        const element = new IntrinsicElement("div", {}, []);
        expect(connectElement(node, element)).toBe(node);
    });
});

describe("replaceNode", () => {
    it("does nothing when replacing node with itself", () => {
        const element = new IntrinsicElement("span", {}, []);
        const node = element.createNode();
        const root = document.createElement("body");
        root.appendChild(node);
        const onDestroy = vi.spyOn(element, "destroy");
        replaceNode(node, node);
        expect(onDestroy).not.toHaveBeenCalled();
        expect(node.parentNode).toBe(root);
    });
    it("does nothing when old DOM element has no parent", () => {
        const root = document.createElement("body");
        const div = document.createElement("div");
        const span = document.createElement("span");
        root.appendChild(span);
        expect(() => replaceNode(div, span)).not.toThrow();
        expect(dump(root)).toBe("<body><span></span></body>");
    });
    it("does nothing when old node is disconnected fragment", () => {
        const root = document.createElement("body");
        const frag = createFragment();
        const span = document.createElement("span");
        root.appendChild(span);
        expect(() => replaceNode(frag, span)).not.toThrow();
        expect(dump(root)).toBe("<body><span></span></body>");
    });
    it("can replace DOM element with fragment", () => {
        const root = document.createElement("body");
        const div = document.createElement("div");
        root.appendChild(div);
        const frag = createFragment("frag");
        frag.appendChild(document.createTextNode("Test"));
        replaceNode(div, frag);
        expect(dump(root)).toBe("<body><frag>Test</frag></body>");
    });
    it("can replace DOM element with DOM element", () => {
        const root = document.createElement("body");
        const div = document.createElement("div");
        root.appendChild(div);
        const span = document.createElement("span");
        span.appendChild(document.createTextNode("Test"));
        replaceNode(div, span);
        expect(dump(root)).toBe("<body><span>Test</span></body>");
    });
    it("can replace fragment with DOM element", () => {
        const root = document.createElement("body");
        const frag = createFragment("frag");
        frag.appendChild(document.createTextNode("Test"));
        root.appendChild(frag);
        const div = document.createElement("div");
        root.appendChild(div);
        replaceNode(frag, div);
        expect(dump(root)).toBe("<body><div></div></body>");
        expect(dump(frag)).toBe("<frag>Test</frag>");
    });
    it("can replace fragment with fragment", () => {
        const root = document.createElement("body");
        const frag1 = createFragment("frag1");
        frag1.appendChild(document.createTextNode("Test1"));
        root.appendChild(frag1);
        const frag2 = createFragment("frag2");
        frag2.appendChild(document.createTextNode("Test2"));
        replaceNode(frag1, frag2);
        expect(dump(root)).toBe("<body><frag2>Test2</frag2></body>");
        expect(dump(frag1)).toBe("<frag1>Test1</frag1>");
    });
    it("calls replace listeners once", () => {
        const oldNode = document.createElement("div");
        const newNode = document.createElement("span");
        const listener1 = vi.fn();
        const listener2 = vi.fn();
        addNodeReplaceListener(oldNode, listener1);
        addNodeReplaceListener(oldNode, listener2);
        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).not.toHaveBeenCalled();
        replaceNode(oldNode, newNode);
        expect(listener1).toHaveBeenCalledExactlyOnceWith(newNode);
        expect(listener2).toHaveBeenCalledExactlyOnceWith(newNode);
        listener1.mockClear();
        listener2.mockClear();
        replaceNode(oldNode, newNode);
        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).not.toHaveBeenCalled();
    });
});
