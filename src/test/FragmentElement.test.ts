/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Observable } from "@kayahr/observable";
import { signal } from "@kayahr/signal";
import { describe, expect, it, vi } from "vitest";

import { Fragment, FragmentElement } from "../main/FragmentElement.js";
import { JSXDocumentFragment, JSXDocumentFragmentEnd, JSXDocumentFragmentStart } from "../main/JSXDocumentFragment.js";
import { removeNode, replaceNode } from "../main/JSXNode.js";

describe("FragmentElement", () => {
    it("returns a fragment element with the given children appended", () => {
        const child1 = document.createElement("div");
        const child2 = document.createTextNode("test");
        const element = Fragment({ children: [ child1, child2 ] });
        expect(element).toBeInstanceOf(FragmentElement);
        const node = element.createNode();
        expect(node).toBeInstanceOf(JSXDocumentFragment);
        expect(Array.from(node.childNodes)).toEqual([ expect.any(JSXDocumentFragmentStart), child1, child2, expect.any(JSXDocumentFragmentEnd) ]);
    });
    it("is destroyed when removed", () => {
        const element = Fragment({ children: [] });
        const onDestroy = vi.spyOn(element, "destroy");
        const node = element.createNode();
        removeNode(node);
        expect(onDestroy).toHaveBeenCalledOnce();
    });
    it("is destroyed when replaced", () => {
        const element = Fragment({ children: [] });
        const onDestroy = vi.spyOn(element, "destroy");
        const node = element.createNode();
        replaceNode(node, document.createElement("div"));
        expect(onDestroy).toHaveBeenCalledOnce();
    });
    describe("createNode", () => {
        it("returns a JSX document fragment containing the given child nodes", () => {
            const child1 = document.createElement("div");
            const child2 = document.createTextNode("test");
            const element = new FragmentElement([ child1, child2 ]);
            const node = element.createNode();
            expect(node).toBeInstanceOf(JSXDocumentFragment);
            expect(Array.from(node.childNodes)).toEqual([ expect.any(JSXDocumentFragmentStart), child1, child2, expect.any(JSXDocumentFragmentEnd) ]);
        });
        it("returns fragment with one child if single node was specified instead of array", () => {
            const child = document.createElement("div");
            const element = new FragmentElement(child);
            const node = element.createNode();
            expect(node).toBeInstanceOf(JSXDocumentFragment);
            expect(Array.from(node.childNodes)).toEqual([ expect.any(JSXDocumentFragmentStart), child, expect.any(JSXDocumentFragmentEnd) ]);
        });
        it("returns fragment with one child if there is only one node in the children array", () => {
            const child = document.createElement("div");
            const element = new FragmentElement([ child ]);
            const node = element.createNode();
            expect(node).toBeInstanceOf(JSXDocumentFragment);
            expect(Array.from(node.childNodes)).toEqual([ expect.any(JSXDocumentFragmentStart), child, expect.any(JSXDocumentFragmentEnd) ]);
        });
        it("returns an empty fragment when there are no children", () => {
            const element = new FragmentElement([]);
            const node = element.createNode();
            expect(node).toBeInstanceOf(JSXDocumentFragment);
            expect(Array.from(node.childNodes)).toEqual([ expect.any(JSXDocumentFragmentStart), expect.any(JSXDocumentFragmentEnd) ]);
        });
        it("resolves single null child to empty text node", () => {
            const element = new FragmentElement(null);
            const node = element.createNode();
            expect(node).toBeInstanceOf(JSXDocumentFragment);
            expect(node.childNodes.length).toBe(3);
            expect(node.childNodes[1]).toEqual(document.createTextNode(""));
        });
        it("resolves single undefined child to empty text node", () => {
            const element = new FragmentElement(undefined);
            const node = element.createNode();
            expect(node).toBeInstanceOf(JSXDocumentFragment);
            expect(node.childNodes.length).toBe(3);
            expect(node.childNodes[1]).toEqual(document.createTextNode(""));
        });
        it("resolves single string child to text node", () => {
            const element = new FragmentElement("test");
            const node = element.createNode();
            expect(node).toBeInstanceOf(JSXDocumentFragment);
            expect(node.childNodes.length).toBe(3);
            expect(node.childNodes[1]).toEqual(document.createTextNode("test"));
        });
        it("resolves single number child to text node", () => {
            const element = new FragmentElement(53);
            const node = element.createNode();
            expect(node).toBeInstanceOf(JSXDocumentFragment);
            expect(node.childNodes.length).toBe(3);
            expect(node.childNodes[1]).toEqual(document.createTextNode("53"));
        });
        it("resolves single boolean 'true' child to text node", () => {
            const element = new FragmentElement(true);
            const node = element.createNode();
            expect(node).toBeInstanceOf(JSXDocumentFragment);
            expect(node.childNodes.length).toBe(3);
            expect(node.childNodes[1]).toEqual(document.createTextNode("true"));
        });
        it("resolves single boolean 'false' child to text node", () => {
            const element = new FragmentElement(false);
            const node = element.createNode();
            expect(node).toBeInstanceOf(JSXDocumentFragment);
            expect(node.childNodes.length).toBe(3);
            expect(node.childNodes[1]).toEqual(document.createTextNode("false"));
        });
        it("resolves single observable child with empty text node which is replaced later with new node", () => {
            let next = (value: string) => {};
            const observable = new Observable<string>(observer => { next = value => observer.next(value); });
            const element = new FragmentElement(observable);
            const node = element.createNode();
            const root = document.createElement("div");
            root.appendChild(node);
            expect(root.outerHTML).toBe("<div></div>");
            next("foo");
            expect(root.outerHTML).toBe("<div>foo</div>");
            next("bar");
            expect(root.outerHTML).toBe("<div>bar</div>");
        });
        it("resolves single promise child with empty text node which is replaced later with new node", async () => {
            let resolve = (value: string) => {};
            const promise = new Promise<string>(resolveFunc => { resolve = resolveFunc; });
            const element = new FragmentElement(promise);
            const node = element.createNode();
            const root = document.createElement("div");
            root.appendChild(node);
            expect(root.outerHTML).toBe("<div></div>");
            resolve("foo");
            await promise;
            expect(root.outerHTML).toBe("<div>foo</div>");
        });
        it("resolves single signal child with text node with initial value and replaces it later with new node", () => {
            const sig = signal(123);
            const element = new FragmentElement(sig);
            const node = element.createNode();
            const root = document.createElement("div");
            root.appendChild(node);
            expect(root.outerHTML).toBe("<div>123</div>");
            sig.set(234);
            expect(root.outerHTML).toBe("<div>234</div>");
            sig.set(345);
            expect(root.outerHTML).toBe("<div>345</div>");
        });
        it("resolves synchronous children correctly", () => {
            const element = new FragmentElement([ null, undefined, "test", 23, true, false ]);
            const node = element.createNode();
            expect(node).toBeInstanceOf(JSXDocumentFragment);
            expect(Array.from(node.childNodes)).toEqual([
                expect.any(JSXDocumentFragmentStart),
                document.createTextNode(""),
                document.createTextNode(""),
                document.createTextNode("test"),
                document.createTextNode("23"),
                document.createTextNode("true"),
                document.createTextNode("false"),
                expect.any(JSXDocumentFragmentEnd)
            ]);
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
            expect(root.outerHTML).toBe("<div>::true</div>");
            next("foo");
            expect(root.outerHTML).toBe("<div>foo::true</div>");
            resolve(123);
            await promise;
            expect(root.outerHTML).toBe("<div>foo:123:true</div>");
            sig.set(false);
            expect(root.outerHTML).toBe("<div>foo:123:false</div>");
        });
        it("works with nested dynamic fragments switched by signal", () => {
            const fragA = new FragmentElement([ "fragA" ]);
            const fragB = new FragmentElement([ "fragB" ]);
            const childFrag = signal(fragA);
            const parentFrag = new FragmentElement([ childFrag ]);
            const root = document.createElement("div");
            root.appendChild(parentFrag.createNode());
            expect(root.outerHTML).toBe("<div>fragA</div>");
            childFrag.set(fragB);
            expect(root.outerHTML).toBe("<div>fragB</div>");
            childFrag.set(fragA);
            expect(root.outerHTML).toBe("<div>fragA</div>");
            childFrag.set(fragB);
            expect(root.outerHTML).toBe("<div>fragB</div>");
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
            expect(root.outerHTML).toBe("<div>fragA</div>");
            level1Frag.set(fragB);
            expect(root.outerHTML).toBe("<div>fragB</div>");
            childFragSig.set(level2Frag);
            expect(root.outerHTML).toBe("<div>fragC</div>");
            level2Frag.set(fragD);
            expect(root.outerHTML).toBe("<div>fragD</div>");
            level1Frag.set(fragA);
            expect(root.outerHTML).toBe("<div>fragD</div>");
            childFragSig.set(level1Frag);
            expect(root.outerHTML).toBe("<div>fragA</div>");
        });
    });
});
