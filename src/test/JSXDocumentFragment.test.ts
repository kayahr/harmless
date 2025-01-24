/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import "@kayahr/vitest-matchers";

import { describe, expect, it, vi } from "vitest";

import { FragmentElement } from "../main/FragmentElement.js";
import { JSXDocumentFragment, JSXDocumentFragmentEnd, JSXDocumentFragmentStart } from "../main/JSXDocumentFragment.js";
import { getFragment } from "../main/JSXNode.js";
import { ValueElement } from "../main/ValueElement.js";
import { createFragment, dump, getFragments } from "./support.js";

describe("JSXDocumentFragment", () => {
    it("extends DocumentFragment", () => {
        expect(new JSXDocumentFragment()).toBeInstanceOf(DocumentFragment);
    });

    describe("constructor", () => {
        it("creates and appends two empty text nodes as start and end anchors", () => {
            const fragment = new JSXDocumentFragment();
            expect(fragment.childNodes.length).toBe(2);
            expect(fragment.childNodes[0]).toBeInstanceOf(JSXDocumentFragmentStart);
            expect(fragment.childNodes[1]).toBeInstanceOf(JSXDocumentFragmentEnd);
            expect(fragment.childNodes[0].textContent).toBe("");
            expect(fragment.childNodes[1].textContent).toBe("");
            expect(getFragment(fragment.childNodes[0])).toBe(fragment);
            expect(getFragment(fragment.childNodes[1])).toBe(fragment);
        });
    });

    describe("hasParentNode", () => {
        it("returns false if fragment is not appended to anything", () => {
            const fragment = new JSXDocumentFragment();
            expect(fragment.hasParentNode()).toBe(false);
        });
        it("returns true if fragment has been appended to DOM element", () => {
            const root = document.createElement("body");
            const fragment = new JSXDocumentFragment();
            fragment.appendTo(root);
            expect(fragment.hasParentNode()).toBe(true);
        });
        it("returns true if fragment has been appended to other fragment", () => {
            const parent = new JSXDocumentFragment();
            const fragment = new JSXDocumentFragment();
            fragment.appendTo(parent);
            expect(fragment.hasParentNode()).toBe(true);
        });
        it("returns false after fragment has been removed from DOM element", () => {
            const root = document.createElement("body");
            const fragment = new JSXDocumentFragment();
            fragment.appendTo(root);
            fragment.remove();
            expect(fragment.hasParentNode()).toBe(false);
        });
        it("returns false after fragment has been removed from other fragment", () => {
            const parent = new JSXDocumentFragment();
            const fragment = new JSXDocumentFragment();
            fragment.appendTo(parent);
            fragment.remove();
            expect(fragment.hasParentNode()).toBe(false);
        });
    });

    describe("getParentFragment", () => {
        it("returns null for root fragment", () => {
            const root = createFragment();
            const child = createFragment();
            root.appendChild(child);
            expect(root.getParentFragment()).toBe(null);
        });
        it("returns the parent fragment", () => {
            const parent = createFragment();
            const child = createFragment();
            parent.appendChild(child);
            expect(child.getParentFragment()).toBe(parent);
        });
        it("returns the parent fragments of multiple children", () => {
            const parent = createFragment();
            const child1 = createFragment();
            parent.appendChild(child1);
            const child2 = createFragment();
            parent.appendChild(child2);
            const child3 = createFragment();
            parent.appendChild(child3);
            const subChild = createFragment();
            child1.appendChild(subChild);
            expect(child1.getParentFragment()).toBe(parent);
            expect(child2.getParentFragment()).toBe(parent);
            expect(child3.getParentFragment()).toBe(parent);
            expect(subChild.getParentFragment()).toBe(child1);
            expect(parent.getParentFragment()).toBe(null);
        });
    });

    describe("appendTo", () => {
        it("returns the appended fragment when appending to DOM element", () => {
            const root = document.createElement("body");
            const fragment = createFragment();
            expect(fragment.appendTo(root)).toBe(fragment);
        });
        it("returns the appended fragment when appending to fragment", () => {
            const parent = createFragment();
            const fragment = createFragment();
            expect(fragment.appendTo(parent)).toBe(fragment);
        });
        it("appends disconnected empty fragment to DOM element", () => {
            const root = document.createElement("body");
            const fragment = createFragment();
            fragment.appendTo(root);
            expect(dump(root)).toBe("<body><></></body>");
            expect(getFragments(root.childNodes)).toEqual([ fragment, fragment ]);
        });
        it("appends disconnected filled fragment to DOM element", () => {
            const root = document.createElement("body");
            const fragment = createFragment();
            const child1 = document.createTextNode("1");
            const child2 = document.createTextNode("2");
            fragment.appendChild(child1);
            fragment.appendChild(child2);
            expect(fragment.hasParentNode()).toBe(false);
            fragment.appendTo(root);
            expect(fragment.hasParentNode()).toBe(true);
            expect(dump(root)).toBe("<body><>12</></body>");
            expect(getFragments(root.childNodes)).toEqual([ fragment, fragment, fragment, fragment ]);
        });
        it("appends connected filled fragment to DOM element", () => {
            const root = document.createElement("body");
            const fragment = createFragment();
            const child1 = document.createTextNode("1");
            const child2 = document.createTextNode("2");
            fragment.appendChild(child1);
            fragment.appendChild(child2);
            expect(fragment.hasParentNode()).toBe(false);
            fragment.appendTo(root);
            expect(fragment.hasParentNode()).toBe(true);
            const newRoot = document.createElement("body");
            fragment.appendTo(newRoot);
            expect(dump(root)).toBe("<body></body>");
            expect(root.childNodes.length).toBe(0);
            expect(dump(newRoot)).toBe("<body><>12</></body>");
            expect(getFragments(newRoot.childNodes)).toEqual([ fragment, fragment, fragment, fragment ]);
        });
        it("appends disconnected empty fragment to other disconnected empty fragment", () => {
            const parent = createFragment("parent");
            const child = createFragment("child");
            child.appendTo(parent);
            expect(dump(child)).toBe("");
            expect(dump(parent)).toBe("<parent><child></child></parent>");
            expect(getFragments(parent.childNodes)).toEqual([ parent, child, child, parent ]);
        });
        it("appends disconnected filled fragment to other disconnected empty fragment", () => {
            const parent = createFragment("parent");
            const child = createFragment("child");
            const a = document.createTextNode("a");
            const b = document.createTextNode("b");
            child.appendChild(a);
            child.appendChild(b);
            child.appendTo(parent);
            expect(dump(child)).toBe("");
            expect(dump(parent)).toBe("<parent><child>ab</child></parent>");
            expect(getFragments(parent.childNodes)).toEqual([ parent, child, child, child, child, parent ]);
        });
        it("appends connected filled fragment to other disconnected empty fragment", () => {
            const root = document.createElement("body");
            const parent = createFragment("parent");
            const child = createFragment("child");
            const a = document.createTextNode("a");
            const b = document.createTextNode("b");
            child.appendChild(a);
            child.appendChild(b);
            child.appendTo(root);
            child.appendTo(parent);
            expect(dump(root)).toBe("<body></body>");
            expect(dump(child)).toBe("");
            expect(dump(parent)).toBe("<parent><child>ab</child></parent>");
            expect(getFragments(parent.childNodes)).toEqual([ parent, child, child, child, child, parent ]);
        });
        it("appends connected filled fragment to other connected filled fragment", () => {
            const root = document.createElement("body");
            const parent = createFragment("parent");
            const child = createFragment("child");
            const a = document.createTextNode("a");
            const b = document.createTextNode("b");
            child.appendChild(a);
            parent.appendChild(b);
            child.appendTo(root);
            parent.appendTo(root);
            expect(dump(root)).toBe("<body><child>a</child><parent>b</parent></body>");
            child.appendTo(parent);
            expect(dump(root)).toBe("<body><parent>b<child>a</child></parent></body>");
            expect(dump(child)).toBe("");
            expect(dump(parent)).toBe("");
            expect(getFragments(root.childNodes)).toEqual([ parent, parent, child, child, child, parent ]);
        });
    });

    describe("appendChild", () => {
        it("returns the appended element", () => {
            const fragment = createFragment();
            const node = document.createElement("div");
            expect(fragment.appendChild(node)).toBe(node);
        });
        it("returns the appended fragment", () => {
            const fragment = createFragment();
            const node = createFragment();
            expect(fragment.appendChild(node)).toBe(node);
        });
    });

    describe("remove", () => {
        it("does nothing when fragment is not anchored", () => {
            const fragment = createFragment();
            const child1 = document.createTextNode("1");
            const child2 = document.createTextNode("2");
            fragment.appendChild(child1);
            fragment.appendChild(child2);
            expect(fragment.hasParentNode()).toBe(false);
            fragment.remove();
            expect(fragment.hasParentNode()).toBe(false);
            expect(dump(fragment)).toBe("<>12</>");
            expect(getFragments(fragment.childNodes)).toEqual([ fragment, fragment, fragment, fragment ]);
        });
        it("moves anchored elements back into the fragment", () => {
            const root = document.createElement("body");
            const fragment = createFragment();
            const child1 = document.createTextNode("1");
            const child2 = document.createTextNode("2");
            fragment.appendChild(child1);
            fragment.appendChild(child2);
            expect(fragment.hasParentNode()).toBe(false);
            fragment.appendTo(root);
            expect(fragment.hasParentNode()).toBe(true);
            expect(dump(root)).toBe("<body><>12</></body>");
            fragment.remove();
            expect(dump(root)).toBe("<body></body>");
            expect(root.childNodes.length).toBe(0);
            expect(fragment.hasParentNode()).toBe(false);
            expect(getFragments(fragment.childNodes)).toEqual([ fragment, fragment, fragment, fragment ]);
        });
        it("moves elements of removed child fragment back from not anchored parent into child fragment", () => {
            const parent = createFragment("parent");
            parent.appendChild(document.createTextNode("a"));
            const child = createFragment("child");
            child.appendChild(document.createTextNode("1"));
            parent.appendChild(child);
            child.appendChild(document.createTextNode("2"));
            parent.appendChild(document.createTextNode("b"));
            expect(dump(parent)).toBe("<parent>a<child>12</child>b</parent>");
            expect(dump(child)).toBe("");
            expect(getFragments(parent.childNodes)).toEqual([ parent, parent, child, child, child, child, parent, parent ]);
            child.remove();
            expect(dump(parent)).toBe("<parent>ab</parent>");
            expect(dump(child)).toBe("<child>12</child>");
            expect(getFragments(parent.childNodes)).toEqual([ parent, parent, parent, parent ]);
            expect(getFragments(child.childNodes)).toEqual([ child, child, child, child ]);
        });
        it("moves elements of removed child fragment back from anchored parent into child fragment", () => {
            const root = document.createElement("body");
            const parent = createFragment("parent");
            parent.appendChild(document.createTextNode("a"));
            parent.appendTo(root);
            const child = createFragment("child");
            child.appendChild(document.createTextNode("1"));
            parent.appendChild(child);
            child.appendChild(document.createTextNode("2"));
            parent.appendChild(document.createTextNode("b"));
            expect(dump(root)).toBe("<body><parent>a<child>12</child>b</parent></body>");
            expect(dump(parent)).toBe("");
            expect(dump(child)).toBe("");
            expect(getFragments(root.childNodes)).toEqual([ parent, parent, child, child, child, child, parent, parent ]);
            child.remove();
            expect(dump(root)).toBe("<body><parent>ab</parent></body>");
            expect(dump(parent)).toBe("");
            expect(dump(child)).toBe("<child>12</child>");
            expect(getFragments(root.childNodes)).toEqual([ parent, parent, parent, parent ]);
            expect(getFragments(parent.childNodes)).toEqual([]);
            expect(getFragments(child.childNodes)).toEqual([ child, child, child, child ]);
        });
        it("throws DOMException if for some reason the fragment has no insertion point any longer", () => {
            const fragment = createFragment();
            fragment.lastChild?.remove();
            expect(() => fragment.appendChild(document.createElement("div"))).toThrowWithMessage(
                DOMException, "Fragment has no insertion parent");
        });
    });

    describe("replaceWith", () => {
        it("replaces a fragment with a new node", () => {
            const root = document.createElement("body");
            const fragment = createFragment();
            const child1 = document.createTextNode("1");
            const child2 = document.createTextNode("2");
            fragment.appendChild(child1);
            fragment.appendChild(child2);
            fragment.appendTo(root);
            expect(dump(root)).toBe("<body><>12</></body>");
            fragment.replaceWith(child2);
            expect(dump(root)).toBe("<body>2</body>");
            expect(fragment.hasParentNode()).toBe(false);
            expect(dump(fragment)).toBe("<>1</>");
            expect(getFragments(fragment.childNodes)).toEqual([ fragment, fragment, fragment ]);
            expect(getFragments(root.childNodes)).toEqual([ null ]);
        });
        it("replaces a child fragment with a new node", () => {
            const root = document.createElement("body");
            const parent = createFragment("parent");
            const child = createFragment("child");
            const a = document.createTextNode("a");
            const b = document.createTextNode("b");
            child.appendChild(a);
            child.appendChild(b);
            child.appendTo(parent);
            parent.appendTo(root);
            expect(dump(root)).toBe("<body><parent><child>ab</child></parent></body>");
            child.replaceWith(b);
            expect(dump(root)).toBe("<body><parent>b</parent></body>");
            expect(parent.hasParentNode()).toBe(true);
            expect(child.hasParentNode()).toBe(false);
            expect(dump(parent)).toBe("");
            expect(dump(child)).toBe("<child>a</child>");
            expect(getFragments(parent.childNodes)).toEqual([ ]);
            expect(getFragments(root.childNodes)).toEqual([ parent, parent, parent ]);
            expect(getFragments(child.childNodes)).toEqual([ child, child, child ]);
        });
        it("throws DOMException if for some reason the fragment has no insertion point any longer", () => {
            const root = document.createElement("body");
            const fragment = createFragment();
            fragment.appendTo(root);
            root.lastChild?.remove();
            expect(() => fragment.replaceWith(document.createElement("div"))).toThrowWithMessage(
                DOMException, "End anchor of fragment not found");
        });
    });
    describe("destroy", () => {
        it("does nothing when no children", () => {
            const fragment = new JSXDocumentFragment();
            expect(() => fragment.destroy()).not.toThrow();
        });
        it("destroys single child element", () => {
            const fragment = new JSXDocumentFragment();
            const element = new ValueElement("test");
            const onDestroy = vi.spyOn(element, "destroy");
            fragment.appendChild(element.createNode());
            expect(onDestroy).not.toHaveBeenCalled();
            fragment.destroy();
            expect(onDestroy).toHaveBeenCalledOnce();
        });
        it("destroys multiple child elements", () => {
            const fragment = new JSXDocumentFragment();
            const element1 = new ValueElement("test");
            const onDestroy1 = vi.spyOn(element1, "destroy");
            const element2 = new ValueElement("test");
            const onDestroy2 = vi.spyOn(element2, "destroy");
            fragment.appendChild(element1.createNode());
            fragment.appendChild(element2.createNode());
            expect(onDestroy1).not.toHaveBeenCalled();
            expect(onDestroy2).not.toHaveBeenCalled();
            fragment.destroy();
            expect(onDestroy1).toHaveBeenCalledOnce();
            expect(onDestroy2).toHaveBeenCalledOnce();
        });
        it("destroys nested fragment", () => {
            const fragment = new JSXDocumentFragment();
            const element = new FragmentElement([]);
            const onDestroy = vi.spyOn(element, "destroy");
            fragment.appendChild(element.createNode());
            expect(onDestroy).not.toHaveBeenCalled();
            fragment.destroy();
            expect(onDestroy).toHaveBeenCalledOnce();
        });
    });
});
