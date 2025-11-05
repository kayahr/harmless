/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Observable } from "@kayahr/observable";
import { signal } from "@kayahr/signal";
import { describe, it } from "node:test";

import { Fragment, FragmentElement } from "../main/FragmentElement.ts";
import { RangeFragment, RangeFragmentEnd, RangeFragmentStart, replaceNode } from "../main/JSXNode.ts";
import { assertEquals, assertInstanceOf, assertSame } from "@kayahr/assert";

describe("FragmentElement", () => {
    it("returns a fragment element with the given children appended", () => {
        const child1 = document.createElement("div");
        const child2 = document.createTextNode("test");
        const element = Fragment({ children: [ child1, child2 ] });
        assertInstanceOf(element, FragmentElement);
        const node = element.createNode();
        assertInstanceOf(node, RangeFragment);
        const children = Array.from(node.childNodes);
        assertSame(children.length, 4);
        assertInstanceOf(children[0], RangeFragmentStart);
        assertEquals(children.slice(1, 3), [ child1, child2 ]);
        assertInstanceOf(children[3], RangeFragmentEnd);
    });
    it("is destroyed when replaced", (context) => {
        const element = Fragment({ children: [] });
        const onDestroy = context.mock.method(element, "destroy");
        const node = element.createNode();
        replaceNode(node, document.createElement("div"));
        assertSame(onDestroy.mock.callCount(), 1);
    });
    describe("createNode", () => {
        it("returns a JSX document fragment containing the given child nodes", () => {
            const child1 = document.createElement("div");
            const child2 = document.createTextNode("test");
            const element = new FragmentElement([ child1, child2 ]);
            const node = element.createNode();
            assertInstanceOf(node, RangeFragment);
            const children = Array.from(node.childNodes)
            assertSame(children.length, 4);
            assertInstanceOf(children[0], RangeFragmentStart);
            assertEquals(children.slice(1, 3), [ child1, child2 ]);
            assertInstanceOf(children[3], RangeFragmentEnd);
        });
        it("returns fragment with one child if single node was specified instead of array", () => {
            const child = document.createElement("div");
            const element = new FragmentElement(child);
            const node = element.createNode();
            assertInstanceOf(node, RangeFragment);
            const children = Array.from(node.childNodes)
            assertSame(children.length, 3);
            assertInstanceOf(children[0], RangeFragmentStart);
            assertSame(children[1], child);
            assertInstanceOf(children[2], RangeFragmentEnd);
        });
        it("returns fragment with one child if there is only one node in the children array", () => {
            const child = document.createElement("div");
            const element = new FragmentElement([ child ]);
            const node = element.createNode();
            assertInstanceOf(node, RangeFragment);
            const children = Array.from(node.childNodes)
            assertSame(children.length, 3);
            assertInstanceOf(children[0], RangeFragmentStart);
            assertSame(children[1], child);
            assertInstanceOf(children[2], RangeFragmentEnd);
        });
        it("returns an empty fragment when there are no children", () => {
            const element = new FragmentElement([]);
            const node = element.createNode();
            assertInstanceOf(node, RangeFragment);
            const children = Array.from(node.childNodes)
            assertSame(children.length, 2);
            assertInstanceOf(children[0], RangeFragmentStart);
            assertInstanceOf(children[1], RangeFragmentEnd);
        });
        it("resolves single null child to empty text node", () => {
            const element = new FragmentElement(null);
            const node = element.createNode();
            assertInstanceOf(node, RangeFragment);
            assertSame(node.childNodes.length, 3);
            assertInstanceOf(node.childNodes[0], RangeFragmentStart);
            assertInstanceOf(node.childNodes[1], Text);
            assertSame(node.childNodes[1].textContent, "");
            assertInstanceOf(node.childNodes[2], RangeFragmentEnd);
        });
        it("resolves single undefined child to empty text node", () => {
            const element = new FragmentElement(undefined);
            const node = element.createNode();
            assertInstanceOf(node, RangeFragment);
            assertSame(node.childNodes.length, 3);
            assertInstanceOf(node.childNodes[0], RangeFragmentStart);
            assertInstanceOf(node.childNodes[1], Text);
            assertSame(node.childNodes[1].textContent, "");
            assertInstanceOf(node.childNodes[2], RangeFragmentEnd);
        });
        it("resolves single string child to text node", () => {
            const element = new FragmentElement("test");
            const node = element.createNode();
            assertInstanceOf(node, RangeFragment);
            assertSame(node.childNodes.length, 3);
            assertInstanceOf(node.childNodes[0], RangeFragmentStart);
            assertInstanceOf(node.childNodes[1], Text);
            assertSame(node.childNodes[1].textContent, "test");
            assertInstanceOf(node.childNodes[2], RangeFragmentEnd);
        });
        it("resolves single number child to text node", () => {
            const element = new FragmentElement(53);
            const node = element.createNode();
            assertInstanceOf(node, RangeFragment);
            assertSame(node.childNodes.length, 3);
            assertInstanceOf(node.childNodes[0], RangeFragmentStart);
            assertInstanceOf(node.childNodes[1], Text);
            assertSame(node.childNodes[1].textContent, "53");
            assertInstanceOf(node.childNodes[2], RangeFragmentEnd);
        });
        it("resolves single boolean 'true' child to text node", () => {
            const element = new FragmentElement(true);
            const node = element.createNode();
            assertInstanceOf(node, RangeFragment);
            assertSame(node.childNodes.length, 3);
            assertInstanceOf(node.childNodes[0], RangeFragmentStart);
            assertInstanceOf(node.childNodes[1], Text);
            assertSame(node.childNodes[1].textContent, "true");
            assertInstanceOf(node.childNodes[2], RangeFragmentEnd);
        });
        it("resolves single boolean 'false' child to text node", () => {
            const element = new FragmentElement(false);
            const node = element.createNode();
            assertInstanceOf(node, RangeFragment);
            assertSame(node.childNodes.length, 3);
            assertInstanceOf(node.childNodes[0], RangeFragmentStart);
            assertInstanceOf(node.childNodes[1], Text);
            assertSame(node.childNodes[1].textContent, "false");
            assertInstanceOf(node.childNodes[2], RangeFragmentEnd);
        });
        it("resolves single observable child with empty text node which is replaced later with new node", () => {
            let next = (value: string) => {};
            const observable = new Observable<string>(observer => { next = value => observer.next(value); });
            const element = new FragmentElement(observable);
            const node = element.createNode();
            const root = document.createElement("div");
            root.appendChild(node);
            assertSame(root.innerHTML, "<!--<>--><!----><!--</>-->");
            next("foo");
            assertSame(root.innerHTML, "<!--<>-->foo<!--</>-->");
            next("bar");
            assertSame(root.innerHTML, "<!--<>-->bar<!--</>-->");
        });
        it("resolves single promise child with empty text node which is replaced later with new node", async () => {
            let resolve = (value: string) => {};
            const promise = new Promise<string>(resolveFunc => { resolve = resolveFunc; });
            const element = new FragmentElement(promise);
            const node = element.createNode();
            const root = document.createElement("div");
            root.appendChild(node);
            assertSame(root.innerHTML, "<!--<>--><!----><!--</>-->");
            resolve("foo");
            await promise;
            assertSame(root.innerHTML, "<!--<>-->foo<!--</>-->");
        });
        it("resolves single signal child with text node with initial value and replaces it later with new node", () => {
            const sig = signal(123);
            const element = new FragmentElement(sig);
            const node = element.createNode();
            const root = document.createElement("div");
            root.appendChild(node);
            assertSame(root.innerHTML, "<!--<>-->123<!--</>-->");
            sig.set(234);
            assertSame(root.innerHTML, "<!--<>-->234<!--</>-->");
            sig.set(345);
            assertSame(root.innerHTML, "<!--<>-->345<!--</>-->");
        });
        it("resolves synchronous children correctly", () => {
            const element = new FragmentElement([ null, undefined, "test", 23, true, false ]);
            const node = element.createNode();
            assertInstanceOf(node, RangeFragment);
            const children = Array.from(node.childNodes)
            assertSame(children.length, 8);
            assertInstanceOf(children[0], RangeFragmentStart);
            assertInstanceOf(children[2], Text);
            assertInstanceOf(children[3], Text);
            assertInstanceOf(children[4], Text);
            assertInstanceOf(children[5], Text);
            assertInstanceOf(children[6], Text);
            assertInstanceOf(children[7], RangeFragmentEnd);
            assertSame(children[1].textContent, "");
            assertSame(children[2].textContent, "");
            assertSame(children[3].textContent, "test");
            assertSame(children[4].textContent, "23");
            assertSame(children[5].textContent, "true");
            assertSame(children[6].textContent, "false");
        });
        it("resolves asynchronous children correctly", async () => {
            let next = (value: string) => {};
            let resolve = (value: number) => {};
            const observable = new Observable<string>(observer => { next = value => observer.next(value); });
            const promise = new Promise<number>(resolveFunc => { resolve = resolveFunc; });
            const sig = signal(true);
            const element = new FragmentElement([ observable, ":", promise, ":", sig ]);
            const node = element.createNode();
            const root = document.createElement("div");
            root.appendChild(node);
            assertSame(root.innerHTML, "<!--<>--><!---->:<!---->:true<!--</>-->");
            next("foo");
            assertSame(root.innerHTML, "<!--<>-->foo:<!---->:true<!--</>-->");
            resolve(123);
            await promise;
            assertSame(root.innerHTML, "<!--<>-->foo:123:true<!--</>-->");
            sig.set(false);
            assertSame(root.innerHTML, "<!--<>-->foo:123:false<!--</>-->");
        });
        it("works with nested dynamic fragments switched by signal", () => {
            const fragA = new FragmentElement([ "fragA" ]);
            const fragB = new FragmentElement([ "fragB" ]);
            const childFrag = signal(fragA);
            const parentFrag = new FragmentElement([ childFrag ]);
            const root = document.createElement("div");
            root.appendChild(parentFrag.createNode());
            assertSame(root.innerHTML, "<!--<>--><!--<>-->fragA<!--</>--><!--</>-->");
            childFrag.set(fragB);
            assertSame(root.innerHTML, "<!--<>--><!--<>-->fragB<!--</>--><!--</>-->");
            childFrag.set(fragA);
            assertSame(root.innerHTML, "<!--<>--><!--<>-->fragA<!--</>--><!--</>-->");
            childFrag.set(fragB);
            assertSame(root.innerHTML, "<!--<>--><!--<>-->fragB<!--</>--><!--</>-->");
        });
        it("works with two-level nested dynamic fragments switched by signal", () => {
            const fragA = new FragmentElement([ "fragA" ]);
            const fragB = new FragmentElement([ "fragB" ]);
            const level1Frag = signal(fragA);
            const fragC = new FragmentElement("fragC");
            const fragD = new FragmentElement("fragD");
            const level2Frag = signal(fragC);
            const childFragSig = signal(level1Frag);
            const childFrag = new FragmentElement(childFragSig);
            const parentFrag = new FragmentElement([ childFrag ]);
            const root = document.createElement("div");
            root.appendChild(parentFrag.createNode());
            assertSame(root.innerHTML, "<!--<>--><!--<>--><!--<>-->fragA<!--</>--><!--</>--><!--</>-->");
            level1Frag.set(fragB);
            assertSame(root.innerHTML, "<!--<>--><!--<>--><!--<>-->fragB<!--</>--><!--</>--><!--</>-->");
            childFragSig.set(level2Frag);
            assertSame(root.innerHTML, "<!--<>--><!--<>--><!--<>-->fragC<!--</>--><!--</>--><!--</>-->");
            level2Frag.set(fragD);
            assertSame(root.innerHTML, "<!--<>--><!--<>--><!--<>-->fragD<!--</>--><!--</>--><!--</>-->");
            level1Frag.set(fragA);
            assertSame(root.innerHTML, "<!--<>--><!--<>--><!--<>-->fragD<!--</>--><!--</>--><!--</>-->");
            childFragSig.set(level1Frag);
            assertSame(root.innerHTML, "<!--<>--><!--<>--><!--<>-->fragA<!--</>--><!--</>--><!--</>-->");
        });
    });
});
