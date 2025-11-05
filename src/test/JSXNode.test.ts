/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { IntrinsicElement } from "../main/IntrinsicElement.ts";
import { JSXElement } from "../main/JSXElement.ts";
import { RangeFragment, RangeFragmentEnd, RangeFragmentStart, addNodeReplaceListener, connectElement, destroyElement, replaceNode } from "../main/JSXNode.ts";
import { createFragment, dump } from "./support.ts";
import { assertInstanceOf, assertNotThrow, assertSame } from "@kayahr/assert";
import { ValueElement } from "../main/ValueElement.ts";
import { FragmentElement } from "../main/FragmentElement.ts";

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
        assertSame(element.destroyed, false);
        destroyElement(node);
        assertSame(element.destroyed, true);
    });
    it("returns the given node", () => {
        const node = document.createElement("div");
        const element = new IntrinsicElement("div", {}, []);
        assertSame(connectElement(node, element), node);
    });
});

describe("replaceNode", () => {
    it("does nothing when replacing node with itself", (context) => {
        const element = new IntrinsicElement("span", {}, []);
        const node = element.createNode();
        const root = document.createElement("body");
        root.appendChild(node);
        const onDestroy = context.mock.method(element, "destroy");
        replaceNode(node, node);
        assertSame(onDestroy.mock.callCount(), 0);
        assertSame(node.parentNode, root);
    });
    it("does nothing when old DOM element has no parent", () => {
        const root = document.createElement("body");
        const div = document.createElement("div");
        const span = document.createElement("span");
        root.appendChild(span);
        assertNotThrow(() => replaceNode(div, span), );
        assertSame(dump(root), "<body><span></span></body>");
    });
    it("does nothing when old node is disconnected fragment", () => {
        const root = document.createElement("body");
        const frag = createFragment();
        const span = document.createElement("span");
        root.appendChild(span);
        assertNotThrow(() => replaceNode(frag, span), );
        assertSame(dump(root), "<body><span></span></body>");
    });
    it("can replace DOM element with fragment", () => {
        const root = document.createElement("body");
        const div = document.createElement("div");
        root.appendChild(div);
        const frag = createFragment("frag");
        frag.appendChild(document.createTextNode("Test"));
        replaceNode(div, frag);
        assertSame(dump(root), "<body><frag>Test</frag></body>");
    });
    it("can replace DOM element with DOM element", () => {
        const root = document.createElement("body");
        const div = document.createElement("div");
        root.appendChild(div);
        const span = document.createElement("span");
        span.appendChild(document.createTextNode("Test"));
        replaceNode(div, span);
        assertSame(dump(root), "<body><span>Test</span></body>");
    });
    it("can replace fragment with DOM element", () => {
        const root = document.createElement("body");
        const frag = createFragment("frag");
        frag.appendChild(document.createTextNode("Test"));
        root.appendChild(frag);
        const div = document.createElement("div");
        root.appendChild(div);
        replaceNode(frag, div);
        assertSame(dump(root), "<body><div></div></body>");
        assertSame(dump(frag), "<frag>Test</frag>");
    });
    it("can replace fragment with fragment", () => {
        const root = document.createElement("body");
        const frag1 = createFragment("frag1");
        frag1.appendChild(document.createTextNode("Test1"));
        root.appendChild(frag1);
        const frag2 = createFragment("frag2");
        frag2.appendChild(document.createTextNode("Test2"));
        replaceNode(frag1, frag2);
        assertSame(dump(root), "<body><frag2>Test2</frag2></body>");
        assertSame(dump(frag1), "<frag1>Test1</frag1>");
    });
    it("calls replace listeners once", (context) => {
        const oldNode = document.createElement("div");
        const newNode = document.createElement("span");
        const listener1 = context.mock.fn();
        const listener2 = context.mock.fn();
        addNodeReplaceListener(oldNode, listener1);
        addNodeReplaceListener(oldNode, listener2);
        assertSame(listener1.mock.callCount(), 0);
        assertSame(listener2.mock.callCount(), 0);
        replaceNode(oldNode, newNode);
        assertSame(listener1.mock.callCount(), 1);
        assertSame(listener1.mock.calls[0].arguments[0], newNode);
        assertSame(listener2.mock.callCount(), 1);
        assertSame(listener2.mock.calls[0].arguments[0], newNode);
        listener1.mock.resetCalls();
        listener2.mock.resetCalls();
        replaceNode(oldNode, newNode);
        assertSame(listener1.mock.callCount(), 0);
        assertSame(listener2.mock.callCount(), 0);
    });
});

describe("RangeFragment", () => {
    it("extends DocumentFragment", () => {
        assertInstanceOf(new RangeFragment(), DocumentFragment);
    });

    describe("constructor", () => {
        it("creates and appends two empty text nodes as start and end anchors", () => {
            const fragment = new RangeFragment();
            assertSame(fragment.childNodes.length, 2);
            assertInstanceOf(fragment.childNodes[0], RangeFragmentStart);
            assertInstanceOf(fragment.childNodes[1], RangeFragmentEnd);
            assertSame(fragment.childNodes[0].textContent, "<>");
            assertSame(fragment.childNodes[1].textContent, "</>");
            assertSame(fragment.childNodes[0].ownerFragment, fragment);
            assertSame(fragment.childNodes[1].ownerFragment, fragment);
        });
    });

    describe("appendChild", () => {
        it("returns the appended element", () => {
            const fragment = createFragment();
            const node = document.createElement("div");
            assertSame(fragment.appendChild(node), node);
        });
        it("returns the appended fragment", () => {
            const fragment = createFragment();
            const node = createFragment();
            assertSame(fragment.appendChild(node), node);
        });
    });

    describe("remove", () => {
        it("does nothing when fragment is not anchored", () => {
            const fragment = createFragment();
            const child1 = document.createTextNode("1");
            const child2 = document.createTextNode("2");
            fragment.appendChild(child1);
            fragment.appendChild(child2);
            fragment.remove();
            assertSame(dump(fragment), "<>12</>");
        });
        it("moves anchored elements back into the fragment", () => {
            const root = document.createElement("body");
            const fragment = createFragment();
            const child1 = document.createTextNode("1");
            const child2 = document.createTextNode("2");
            fragment.appendChild(child1);
            fragment.appendChild(child2);
            root.appendChild(fragment);
            assertSame(dump(root), "<body><>12</></body>");
            fragment.remove();
            assertSame(dump(root), "<body></body>");
            assertSame(root.childNodes.length, 0);
        });
        it("moves elements of removed child fragment back from not anchored parent into child fragment", () => {
            const parent = createFragment("parent");
            parent.appendChild(document.createTextNode("a"));
            const child = createFragment("child");
            child.appendChild(document.createTextNode("1"));
            parent.appendChild(child);
            child.appendChild(document.createTextNode("2"));
            parent.appendChild(document.createTextNode("b"));
            assertSame(dump(parent), "<parent>a<child>12</child>b</parent>");
            assertSame(dump(child), "");
            child.remove();
            assertSame(dump(parent), "<parent>ab</parent>");
            assertSame(dump(child), "<child>12</child>");
        });
        it("moves elements of removed child fragment back from anchored parent into child fragment", () => {
            const root = document.createElement("body");
            const parent = createFragment("parent");
            parent.appendChild(document.createTextNode("a"));
            root.appendChild(parent);
            const child = createFragment("child");
            child.appendChild(document.createTextNode("1"));
            parent.appendChild(child);
            child.appendChild(document.createTextNode("2"));
            parent.appendChild(document.createTextNode("b"));
            assertSame(dump(root), "<body><parent>a<child>12</child>b</parent></body>");
            assertSame(dump(parent), "");
            assertSame(dump(child), "");
            child.remove();
            assertSame(dump(root), "<body><parent>ab</parent></body>");
            assertSame(dump(parent), "");
            assertSame(dump(child), "<child>12</child>");
        });
    });

    describe("replaceWith", () => {
        it("does nothing when replaced with itself", (context) => {
            const root = document.createElement("body");
            const fragment = new RangeFragment();
            root.appendChild(fragment);
            const onDestroy = context.mock.method(fragment, "destroy");
            fragment.replaceWith(fragment);
            assertSame(onDestroy.mock.callCount(), 0);
        });
        it("replaces a fragment with a new node", () => {
            const root = document.createElement("body");
            const fragment = createFragment();
            const child1 = document.createTextNode("1");
            const child2 = document.createTextNode("2");
            fragment.appendChild(child1);
            fragment.appendChild(child2);
            root.appendChild(fragment);
            assertSame(dump(root), "<body><>12</></body>");
            fragment.replaceWith(child2);
            assertSame(dump(root), "<body>2</body>");
            assertSame(dump(fragment), "<>1</>");
        });
        it("replaces a child fragment with a new node", () => {
            const root = document.createElement("body");
            const parent = createFragment("parent");
            const child = createFragment("child");
            const a = document.createTextNode("a");
            const b = document.createTextNode("b");
            child.appendChild(a);
            child.appendChild(b);
            parent.appendChild(child);
            root.appendChild(parent);
            assertSame(dump(root), "<body><parent><child>ab</child></parent></body>");
            child.replaceWith(b);
            assertSame(dump(root), "<body><parent>b</parent></body>");
            assertSame(dump(parent), "");
            assertSame(dump(child), "<child>a</child>");
        });
    });
    describe("destroy", () => {
        it("does nothing when no children", () => {
            const fragment = new RangeFragment();
            assertNotThrow(() => fragment.destroy(), );
        });
        it("destroys single child element", (context) => {
            const fragment = new RangeFragment();
            const element = new ValueElement("test");
            const onDestroy = context.mock.method(element, "destroy");
            fragment.appendChild(element.createNode());
            assertSame(onDestroy.mock.callCount(), 0);
            fragment.destroy();
            assertSame(onDestroy.mock.callCount(), 1);
        });
        it("destroys multiple child elements", (context) => {
            const fragment = new RangeFragment();
            const element1 = new ValueElement("test");
            const onDestroy1 = context.mock.method(element1, "destroy");
            const element2 = new ValueElement("test");
            const onDestroy2 = context.mock.method(element2, "destroy");
            fragment.appendChild(element1.createNode());
            fragment.appendChild(element2.createNode());
            assertSame(onDestroy1.mock.callCount(), 0);
            assertSame(onDestroy2.mock.callCount(), 0);
            fragment.destroy();
            assertSame(onDestroy1.mock.callCount(), 1);
            assertSame(onDestroy2.mock.callCount(), 1);
        });
        it("destroys nested fragment", (context) => {
            const fragment = new RangeFragment();
            const element = new FragmentElement([]);
            const onDestroy = context.mock.method(element, "destroy");
            fragment.appendChild(element.createNode());
            assertSame(onDestroy.mock.callCount(), 0);
            fragment.destroy();
            assertSame(onDestroy.mock.callCount(), 1);
        });
    });
});
