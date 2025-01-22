/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import "@kayahr/vitest-matchers";

import { describe, expect, it, vi } from "vitest";

import { IntrinsicElement } from "../main/IntrinsicElement.js";
import { JSXDocumentFragment } from "../main/JSXDocumentFragment.js";
import { JSXElement } from "../main/JSXElement.js";
import { addNodeReplaceListener, appendChild, connectElement, destroyElement, getFragment, removeNode, replaceNode } from "../main/JSXNode.js";
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

describe("appendChild", () => {
    it("returns added DOM element", () => {
        const root = document.createElement("body");
        const newNode = document.createElement("div");
        expect(appendChild(root, newNode)).toBe(newNode);
    });
    it("returns added fragment", () => {
        const root = document.createElement("body");
        const frag = createFragment();
        expect(appendChild(root, frag)).toBe(frag);
    });
    it("can append DOM element to fragment", () => {
        const root = document.createElement("body");
        const fragment = createFragment("frag");
        fragment.appendTo(root);
        const newNode = document.createTextNode("Test");
        appendChild(fragment, newNode);
        expect(dump(root)).toBe("<body><frag>Test</frag></body>");
        expect(getFragment(newNode)).toBe(fragment);
    });
    it("can append DOM element to DOM element", () => {
        const root = document.createElement("body");
        const fragment = createFragment("frag");
        fragment.appendTo(root);
        const newNode = document.createTextNode("Test");
        appendChild(root, newNode);
        expect(dump(root)).toBe("<body><frag></frag>Test</body>");
        expect(getFragment(newNode)).toBe(null);
    });
    it("can append fragment to DOM element", () => {
        const root = document.createElement("body");
        const fragment = createFragment("frag");
        fragment.appendChild(document.createTextNode("Test"));
        appendChild(root, fragment);
        expect(dump(root)).toBe("<body><frag>Test</frag></body>");
        root.appendChild(document.createTextNode("Start"));
        appendChild(root, fragment);
        expect(dump(root)).toBe("<body>Start<frag>Test</frag></body>");
    });
    it("can append fragment to fragment", () => {
        const root = document.createElement("body");
        const fragment = createFragment("frag");
        fragment.appendChild(document.createTextNode("Test"));
        fragment.appendTo(root);
        const parent = createFragment("parent");
        appendChild(parent, fragment);
        expect(dump(root)).toBe("<body></body>");
        expect(dump(parent)).toBe("<parent><frag>Test</frag></parent>");
    });
    it("corrects owner fragment metadata when moving element around", () => {
        const root = document.createElement("body");
        const frag1 = createFragment();
        frag1.appendTo(root);
        const frag2 = createFragment();
        frag2.appendTo(frag1);
        const node = document.createElement("div");
        appendChild(root, node);
        expect(getFragment(node)).toBe(null);
        appendChild(frag1, node);
        expect(getFragment(node)).toBe(frag1);
        appendChild(frag2, node);
        expect(getFragment(node)).toBe(frag2);
        appendChild(root, node);
        expect(getFragment(node)).toBe(null);
    });
    it("corrects owner fragment metadata when moving element around in disconnected fragments", () => {
        const root = document.createElement("body");
        const frag1 = createFragment();
        const frag2 = createFragment();
        const node = document.createElement("div");
        appendChild(frag1, node);
        expect(getFragment(node)).toBe(frag1);
        appendChild(frag2, node);
        expect(getFragment(node)).toBe(frag2);
        appendChild(root, node);
        expect(getFragment(node)).toBe(null);
    });
});

describe("replaceNode", () => {
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
        expect(getFragment(span)).toBe(null);
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
        frag.appendTo(root);
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
        frag1.appendTo(root);
        const frag2 = createFragment("frag2");
        frag2.appendChild(document.createTextNode("Test2"));
        replaceNode(frag1, frag2);
        expect(dump(root)).toBe("<body><frag2>Test2</frag2></body>");
        expect(dump(frag1)).toBe("<frag1>Test1</frag1>");
    });
    it("corrects owner fragment metadata when moving element around in fragments", () => {
        const root = document.createElement("body");
        const frag1 = createFragment("frag1");
        const a = document.createElement("div");
        frag1.appendChild(a);
        frag1.appendTo(root);
        const frag2 = createFragment("frag2");
        const b = document.createElement("div");
        frag2.appendChild(b);
        frag2.appendTo(frag1);
        const node = document.createElement("foo");
        const frag3 = createFragment();
        const c = document.createElement("div");
        frag3.appendChild(c);
        const d = document.createElement("div");
        root.appendChild(d);

        replaceNode(a, node);
        expect(getFragment(a)).toBe(null);
        expect(getFragment(node)).toBe(frag1);
        replaceNode(b, node);
        expect(getFragment(b)).toBe(null);
        expect(getFragment(node)).toBe(frag2);
        replaceNode(c, node);
        expect(getFragment(c)).toBe(null);
        expect(getFragment(node)).toBe(frag3);
        replaceNode(d, node);
        expect(getFragment(d)).toBe(null);
        expect(getFragment(node)).toBe(null);
    });
    it("corrects owner fragment metadata when replacing child fragment with DOM element", () => {
        const root = document.createElement("body");
        const parent = createFragment("parent");
        const child = createFragment("child");
        const newNode = document.createElement("div");
        child.appendTo(parent);
        parent.appendTo(root);
        replaceNode(child, newNode);
        expect(getFragment(newNode)).toBe(parent);
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

    describe("removeNode", () => {
        it("does nothing if node has no parent", () => {
            const node = document.createElement("div");
            expect(() => removeNode(node)).not.toThrow();
        });
        it("does nothing if fragment has no parent", () => {
            const node = new JSXDocumentFragment();
            expect(() => removeNode(node)).not.toThrow();
        });
        it("removes a node from disconnected fragment", () => {
            const node = document.createElement("div");
            const fragment = new JSXDocumentFragment();
            fragment.appendChild(node);
            expect(getFragment(node)).toBe(fragment);
            expect(fragment.childNodes.length).toBe(3);
            expect(fragment.childNodes[1]).toBe(node);
            expect(node.parentNode).toBe(fragment);
            removeNode(node);
            expect(getFragment(node)).toBe(null);
            expect(fragment.childNodes.length).toBe(2);
            expect(node.parentNode).toBe(null);
        });
        it("removes a node from connected fragment", () => {
            const root = document.createElement("body");
            const node = document.createElement("div");
            const fragment = new JSXDocumentFragment();
            fragment.appendTo(root);
            fragment.appendChild(node);
            expect(getFragment(node)).toBe(fragment);
            expect(root.childNodes.length).toBe(3);
            expect(root.childNodes[1]).toBe(node);
            expect(node.parentNode).toBe(root);
            removeNode(node);
            expect(getFragment(node)).toBe(null);
            expect(root.childNodes.length).toBe(2);
            expect(node.parentNode).toBe(null);
        });
        it("removes fragment from DOM node parent", () => {
            const root = document.createElement("body");
            const fragment = new JSXDocumentFragment();
            fragment.appendTo(root);
            expect(root.childNodes.length).toBe(2);
            removeNode(fragment);
            expect(root.childNodes.length).toBe(0);
        });
        it("removes fragment from parent fragment", () => {
            const parent = new JSXDocumentFragment();
            const fragment = new JSXDocumentFragment();
            fragment.appendTo(parent);
            expect(parent.childNodes.length).toBe(4);
            removeNode(fragment);
            expect(parent.childNodes.length).toBe(2);
        });
    });
});
