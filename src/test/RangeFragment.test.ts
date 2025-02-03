/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import "@kayahr/vitest-matchers";

import { describe, expect, it, vi } from "vitest";

import { FragmentElement } from "../main/FragmentElement.js";
import { RangeFragment, RangeFragmentEnd, RangeFragmentStart } from "../main/RangeFragment.js";
import { ValueElement } from "../main/ValueElement.js";
import { createFragment, dump } from "./support.js";

describe("RangeFragment", () => {
    it("extends DocumentFragment", () => {
        expect(new RangeFragment()).toBeInstanceOf(DocumentFragment);
    });

    describe("constructor", () => {
        it("creates and appends two empty text nodes as start and end anchors", () => {
            const fragment = new RangeFragment();
            expect(fragment.childNodes.length).toBe(2);
            expect(fragment.childNodes[0]).toBeInstanceOf(RangeFragmentStart);
            expect(fragment.childNodes[1]).toBeInstanceOf(RangeFragmentEnd);
            expect(fragment.childNodes[0].textContent).toBe("<>");
            expect(fragment.childNodes[1].textContent).toBe("</>");
            expect((fragment.childNodes[0] as RangeFragmentStart).ownerFragment).toBe(fragment);
            expect((fragment.childNodes[1] as RangeFragmentEnd).ownerFragment).toBe(fragment);
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
            fragment.remove();
            expect(dump(fragment)).toBe("<>12</>");
        });
        it("moves anchored elements back into the fragment", () => {
            const root = document.createElement("body");
            const fragment = createFragment();
            const child1 = document.createTextNode("1");
            const child2 = document.createTextNode("2");
            fragment.appendChild(child1);
            fragment.appendChild(child2);
            root.appendChild(fragment);
            expect(dump(root)).toBe("<body><>12</></body>");
            fragment.remove();
            expect(dump(root)).toBe("<body></body>");
            expect(root.childNodes.length).toBe(0);
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
            child.remove();
            expect(dump(parent)).toBe("<parent>ab</parent>");
            expect(dump(child)).toBe("<child>12</child>");
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
            expect(dump(root)).toBe("<body><parent>a<child>12</child>b</parent></body>");
            expect(dump(parent)).toBe("");
            expect(dump(child)).toBe("");
            child.remove();
            expect(dump(root)).toBe("<body><parent>ab</parent></body>");
            expect(dump(parent)).toBe("");
            expect(dump(child)).toBe("<child>12</child>");
        });
    });

    describe("replaceWith", () => {
        it("does nothing when replaced with itself", () => {
            const root = document.createElement("body");
            const fragment = new RangeFragment();
            root.appendChild(fragment);
            const onDestroy = vi.spyOn(fragment, "destroy");
            fragment.replaceWith(fragment);
            expect(onDestroy).not.toHaveBeenCalled();
        });
        it("replaces a fragment with a new node", () => {
            const root = document.createElement("body");
            const fragment = createFragment();
            const child1 = document.createTextNode("1");
            const child2 = document.createTextNode("2");
            fragment.appendChild(child1);
            fragment.appendChild(child2);
            root.appendChild(fragment);
            expect(dump(root)).toBe("<body><>12</></body>");
            fragment.replaceWith(child2);
            expect(dump(root)).toBe("<body>2</body>");
            expect(dump(fragment)).toBe("<>1</>");
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
            expect(dump(root)).toBe("<body><parent><child>ab</child></parent></body>");
            child.replaceWith(b);
            expect(dump(root)).toBe("<body><parent>b</parent></body>");
            expect(dump(parent)).toBe("");
            expect(dump(child)).toBe("<child>a</child>");
        });
    });
    describe("destroy", () => {
        it("does nothing when no children", () => {
            const fragment = new RangeFragment();
            expect(() => fragment.destroy()).not.toThrow();
        });
        it("destroys single child element", () => {
            const fragment = new RangeFragment();
            const element = new ValueElement("test");
            const onDestroy = vi.spyOn(element, "destroy");
            fragment.appendChild(element.createNode());
            expect(onDestroy).not.toHaveBeenCalled();
            fragment.destroy();
            expect(onDestroy).toHaveBeenCalledOnce();
        });
        it("destroys multiple child elements", () => {
            const fragment = new RangeFragment();
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
            const fragment = new RangeFragment();
            const element = new FragmentElement([]);
            const onDestroy = vi.spyOn(element, "destroy");
            fragment.appendChild(element.createNode());
            expect(onDestroy).not.toHaveBeenCalled();
            fragment.destroy();
            expect(onDestroy).toHaveBeenCalledOnce();
        });
    });
});
