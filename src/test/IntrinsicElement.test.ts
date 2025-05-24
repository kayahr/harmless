/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import "@kayahr/vitest-matchers";

import { Observable, type SubscriptionObserver } from "@kayahr/observable";
import { signal } from "@kayahr/signal";
import { describe, expect, it, vi } from "vitest";

import { FragmentElement } from "../main/FragmentElement.js";
import { IntrinsicElement } from "../main/IntrinsicElement.js";
import { ref } from "../main/utils/Reference.js";

describe("IntrinsicElement", () => {
    describe("createNode", () => {
        it("returns HTML node with given properties and children", () => {
            const element = new IntrinsicElement("div", { id: "foo", class: "bar" }, [ 1, "test" ]);
            const node = element.createNode() as HTMLElement;
            expect(node).toBeInstanceOf(HTMLDivElement);
            expect(node.outerHTML).toBe('<div id="foo" class="bar">1test</div>');
        });
        it("can create HTML node without properties and children", () => {
            const element = new IntrinsicElement("div", {}, []);
            const node = element.createNode() as HTMLElement;
            expect(node).toBeInstanceOf(HTMLDivElement);
            expect(node.outerHTML).toBe("<div></div>");
        });
        it("connects event listener functions", () => {
            const fn = vi.fn();
            const element = new IntrinsicElement("button", { onclick: fn }, []);
            const node = element.createNode() as HTMLButtonElement;
            expect(node).toBeInstanceOf(HTMLButtonElement);
            expect(node.outerHTML).toBe("<button></button>");
            expect(fn).not.toHaveBeenCalled();
            node.click();
            expect(fn).toHaveBeenCalledOnce();
        });
        it("can dynamically update event listener", () => {
            const fn1 = vi.fn();
            const fn2 = vi.fn();
            const onClick = signal(fn1);
            const element = new IntrinsicElement("button", { onclick: onClick }, []);
            const node = element.createNode() as HTMLButtonElement;
            expect(node).toBeInstanceOf(HTMLButtonElement);
            expect(node.outerHTML).toBe("<button></button>");
            expect(fn1).not.toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
            node.click();
            expect(fn1).toHaveBeenCalledOnce();
            expect(fn2).not.toHaveBeenCalled();
            fn1.mockClear();
            onClick.set(fn2);
            node.click();
            expect(fn1).not.toHaveBeenCalled();
            expect(fn2).toHaveBeenCalledOnce();
        });
        it("can unset event listener", () => {
            const fn = vi.fn();
            const onClick = signal<Function | null>(fn);
            const element = new IntrinsicElement("button", { onclick: onClick }, []);
            const node = element.createNode() as HTMLButtonElement;
            expect(node).toBeInstanceOf(HTMLButtonElement);
            expect(node.outerHTML).toBe("<button></button>");
            expect(fn).not.toHaveBeenCalled();
            node.click();
            expect(fn).toHaveBeenCalledOnce();
            fn.mockClear();
            onClick.set(null);
            node.click();
            expect(fn).not.toHaveBeenCalled();
        });
        it("removes attributes when value is null or undefined", () => {
            const value = signal<unknown>("test");
            const element = new IntrinsicElement("div", { id: value, class: "cls" }, []);
            const node = element.createNode() as HTMLDivElement;
            expect(node.outerHTML).toBe('<div id="test" class="cls"></div>');
            value.set(null);
            expect(node.outerHTML).toBe('<div class="cls"></div>');
            value.set(4);
            expect(node.outerHTML).toBe('<div class="cls" id="4"></div>');
            value.set(undefined);
            expect(node.outerHTML).toBe('<div class="cls"></div>');
        });
        it("can set attribute values via promise", async () => {
            const promise = new Promise(resolve => setTimeout(() => resolve("foo"), 0));
            const element = new IntrinsicElement("div", { id: promise, class: "cls" }, []);
            const node = element.createNode() as HTMLDivElement;
            expect(node.outerHTML).toBe('<div class="cls"></div>');
            await promise;
            expect(node.outerHTML).toBe('<div class="cls" id="foo"></div>');
        });
        it("can set attribute values via function call", () => {
            const element = new IntrinsicElement("div", { id: () => 123, class: "cls" }, []);
            const node = element.createNode() as HTMLDivElement;
            expect(node.outerHTML).toBe('<div id="123" class="cls"></div>');
        });
        it("can set attribute values from recursive functions", () => {
            const func1 = (): string => "test";
            const func2 = (): Function => func1;
            const func3 = (): Function => func2;
            const element = new IntrinsicElement("div", { id: func3 }, []);
            const node = element.createNode() as HTMLDivElement;
            expect(node.outerHTML).toBe('<div id="test"></div>');
        });
        it("can add/remove attributes via boolean", () => {
            const disabled = signal(false);
            const element = new IntrinsicElement("button", { disabled }, []);
            const node = element.createNode() as HTMLButtonElement;
            expect(node.outerHTML).toBe("<button></button>");
            disabled.set(true);
            expect(node.outerHTML).toBe('<button disabled=""></button>');
            disabled.set(false);
            expect(node.outerHTML).toBe("<button></button>");
        });
        it("can set attribute values via observable", () => {
            let observer = null as null | SubscriptionObserver<number>;
            const observable = new Observable<number>(arg => { observer = arg; });
            const element = new IntrinsicElement("span", { id: observable }, []);
            const node = element.createNode() as HTMLSpanElement;
            expect(node).toBeInstanceOf(HTMLSpanElement);
            expect(node.outerHTML).toEqual("<span></span>");
            observer?.next(1);
            expect(node.outerHTML).toEqual('<span id="1"></span>');
            observer?.next(2);
            expect(node.outerHTML).toEqual('<span id="2"></span>');
        });
        it("unsubscribes from observable attribute when element has been garbage collected when new value is emitted", async () => {
            let observer = null as null | SubscriptionObserver<number>;
            const observable = new Observable<number>(arg => {
                observer = arg;
                return () => {
                    observer = null;
                };
            });
            const element = new IntrinsicElement("span", { id: observable }, []);
            let node: HTMLElement | null = element.createNode() as HTMLSpanElement;
            expect(node?.outerHTML).toEqual("<span></span>");
            observer?.next(1);
            expect(node?.outerHTML).toEqual('<span id="1"></span>');
            await expect(new WeakRef(node)).toBeGarbageCollected(() => { node = null; element.destroy(); });
            expect(observer).not.toBeNull();
            observer?.next(2);
            expect(observer).toBeNull();
        });
        it("can set style attribute", () => {
            const node = new IntrinsicElement("div", { style: { color: "red", "font-size": "12px" } }, []).createNode() as HTMLDivElement;
            expect(node.outerHTML).toBe('<div style="color: red; font-size: 12px"></div>');
        });
        it("can dynamically set style attribute", () => {
            const color = signal("red");
            const node = new IntrinsicElement("div", { style: () => ({ color: color.get(), "font-size": "12px" }) }, []).createNode() as HTMLDivElement;
            expect(node.outerHTML).toBe('<div style="color: red; font-size: 12px"></div>');
            color.set("blue");
            expect(node.outerHTML).toBe('<div style="color: blue; font-size: 12px"></div>');
        });
        it("resolves null child to empty text node", () => {
            const node = new IntrinsicElement("div", {}, [ null ]).createNode() as HTMLElement;
            expect(node.outerHTML).toEqual("<div></div>");
            expect(node.childNodes.length).toBe(1);
            expect(node.firstChild).toEqual(document.createTextNode(""));
        });
        it("passes through already resolved children", () => {
            const child = document.createElement("span");
            child.setAttribute("class", "bar");
            child.appendChild(document.createTextNode("foo"));
            const node = new IntrinsicElement("div", {}, [ child ]).createNode() as HTMLElement;
            expect(node.childNodes.length).toBe(1);
            expect(node.childNodes[0]).toBe(child);
            expect(node.outerHTML).toBe('<div><span class="bar">foo</span></div>');
        });
        it("resolves undefined child to empty text node", () => {
            const node = new IntrinsicElement("div", {}, [ undefined ]).createNode() as HTMLElement;
            expect(node.outerHTML).toEqual("<div></div>");
            expect(node.childNodes.length).toBe(1);
            expect(node.firstChild).toEqual(document.createTextNode(""));
        });
        it("resolves string child to text node", () => {
            const node = new IntrinsicElement("div", {}, [ "test" ]).createNode() as HTMLElement;
            expect(node.outerHTML).toEqual("<div>test</div>");
            expect(node.childNodes.length).toBe(1);
            expect(node.firstChild).toEqual(document.createTextNode("test"));
        });
        it("resolves number child to text node", () => {
            const node = new IntrinsicElement("div", {}, [ 123 ]).createNode() as HTMLElement;
            expect(node.outerHTML).toEqual("<div>123</div>");
            expect(node.childNodes.length).toBe(1);
            expect(node.firstChild).toEqual(document.createTextNode("123"));
        });
        it("resolves boolean children to empty text node", () => {
            const node = new IntrinsicElement("div", {}, [ true, ":", false ]).createNode() as HTMLElement;
            expect(node.outerHTML).toEqual("<div>true:false</div>");
            expect(node.childNodes.length).toBe(3);
            expect(node.childNodes[0]).toEqual(document.createTextNode("true"));
            expect(node.childNodes[2]).toEqual(document.createTextNode("false"));
        });
        it("resolves observable child with empty text node which is replaced later with new node", () => {
            let next = (value: string) => {};
            const observable = new Observable<string>(observer => { next = value => observer.next(value); });
            const node = new IntrinsicElement("div", {}, [ observable ]).createNode() as HTMLElement;
            expect(node.outerHTML).toBe("<div><!----></div>");
            next("foo");
            expect(node.outerHTML).toBe("<div>foo</div>");
            next("bar");
            expect(node.outerHTML).toBe("<div>bar</div>");
        });
        it("unsubscribes from observable when element has been garbage collected when new value is emitted", async () => {
            let observer = null as null | SubscriptionObserver<number>;
            const observable = new Observable<number>(arg => {
                observer = arg;
                return () => {
                    observer = null;
                };
            });
            const element = new IntrinsicElement("span", {}, [ observable ]);
            let node: HTMLElement | null = element.createNode() as HTMLElement;
            expect(node.outerHTML).toEqual("<span><!----></span>");
            observer?.next(1);
            expect(node.outerHTML).toEqual("<span>1</span>");
            await expect(new WeakRef(node)).toBeGarbageCollected(() => { element.destroy(); node = null; });
            expect(observer).toBeNull();
        });
        it("resolves promise child with empty text node which is replaced later with new node", async () => {
            const promise = new Promise<string>(resolve => setTimeout(() => resolve("foo"), 0));
            const node = new IntrinsicElement("div", {}, [ promise ]).createNode() as HTMLElement;
            expect(node.outerHTML).toBe("<div><!----></div>");
            await promise;
            expect(node.outerHTML).toBe("<div>foo</div>");
        });
        it("resolves signal child with text node with initial value and replaces it later with new node", () => {
            const sig = signal(123);
            const node = new IntrinsicElement("div", {}, [ sig ]).createNode() as HTMLElement;
            expect(node.outerHTML).toBe("<div>123</div>");
            sig.set(234);
            expect(node.outerHTML).toBe("<div>234</div>");
            sig.set(345);
            expect(node.outerHTML).toBe("<div>345</div>");
        });
        it("resolves synchronous children correctly", () => {
            const node = new IntrinsicElement("div", {}, [ null, undefined, "test", 23, true, false ]).createNode() as HTMLElement;
            expect(node).toBeInstanceOf(HTMLDivElement);
            expect(Array.from(node.childNodes)).toEqual([
                document.createTextNode(""),
                document.createTextNode(""),
                document.createTextNode("test"),
                document.createTextNode("23"),
                document.createTextNode("true"),
                document.createTextNode("false")
            ]);
        });
        it("resolves asynchronous children correctly", async () => {
            let next = (value: string) => {};
            let resolve = (value: number) => {};
            const observable = new Observable<string>(observer => { next = value => observer.next(value); });
            const promise = new Promise<number>(resolveFunc => { resolve = resolveFunc; });
            const sig = signal(true);
            const node = new IntrinsicElement("div", {}, [ observable, ":", promise, ":", sig ]).createNode() as HTMLElement;
            expect(node.outerHTML).toBe("<div><!---->:<!---->:true</div>");
            next("foo");
            expect(node.outerHTML).toBe("<div>foo:<!---->:true</div>");
            resolve(123);
            await promise;
            expect(node.outerHTML).toBe("<div>foo:123:true</div>");
            sig.set(false);
            expect(node.outerHTML).toBe("<div>foo:123:false</div>");
        });
        it("resolves function children", () => {
            const func = (): string => "test";
            const node = new IntrinsicElement("span", {}, [ func ]).createNode() as HTMLElement;
            expect(node.outerHTML).toBe("<span>test</span>");
        });
        it("resolves children recursively", () => {
            const func1 = (): string => "test";
            const func2 = (): Function => func1;
            const func3 = (): Function => func2;
            const node = new IntrinsicElement("span", {}, [ func3 ]).createNode() as HTMLElement;
            expect(node.outerHTML).toBe("<span>test</span>");
        });
        it("tracks signals dependencies in function children", () => {
            const value = signal(1);
            const func = () => value.get() * 2;
            const node = new IntrinsicElement("span", {}, [ func ]).createNode() as HTMLElement;
            expect(node.outerHTML).toBe("<span>2</span>");
            value.set(2);
            expect(node.outerHTML).toBe("<span>4</span>");
        });
        it("resolves other JSX elements", () => {
            const child = new IntrinsicElement("span", {}, [ "test" ]);
            const node = new IntrinsicElement("div", {}, [ child ]).createNode() as HTMLElement;
            expect(node.outerHTML).toBe("<div><span>test</span></div>");
        });
        it("resolves JSX fragment child", () => {
            const child = new FragmentElement([ 123, " ", true ]);
            const node = new IntrinsicElement("div", {}, [ child ]).createNode() as HTMLElement;
            expect(node.innerHTML).toBe("<!--<>-->123 true<!--</>-->");
        });
        it("asynchronously resolves JSX fragment child from promise", async () => {
            const child = new Promise(resolve => setTimeout(() => resolve(new FragmentElement([ 123, " ", true ])), 0));
            const node = new IntrinsicElement("div", {}, [ child ]).createNode() as HTMLElement;
            expect(node.innerHTML).toBe("<!---->");
            await child;
            expect(node.innerHTML).toBe("<!--<>-->123 true<!--</>-->");
        });
        it("asynchronously resolves JSX fragment child from observable", () => {
            const child = signal(new FragmentElement([ 123, " ", true ]));
            const node = new IntrinsicElement("div", {}, [ child ]).createNode() as HTMLElement;
            expect(node.innerHTML).toBe("<!--<>-->123 true<!--</>-->");
            child.set(new FragmentElement([ false, " ", 5 ]));
            expect(node.innerHTML).toBe("<!--<>-->false 5<!--</>-->");
        });
        it("recursively resolves array children to fragments", () => {
            const node = new IntrinsicElement("div", {}, [ [ 1, 2, [ 3, 4 ] ] ]).createNode() as HTMLElement;
            expect(node.innerHTML).toBe("<!--<>-->12<!--<>-->34<!--</>--><!--</>-->");
        });
        it("resolves array with only one value", () => {
            const node = new IntrinsicElement("div", {}, [ [ 1 ], [ 2 ] ]).createNode() as HTMLElement;
            expect(node.innerHTML).toBe("<!--<>-->1<!--</>--><!--<>-->2<!--</>-->");
        });
        it("writes element to a Reference ref", () => {
            const nodeRef = ref();
            expect(nodeRef.get()).toBe(null);
            const node = new IntrinsicElement("button", { ref: nodeRef }, []).createNode();
            expect(nodeRef.get()).toBe(node);
        });
        it("writes element to a Signal ref", () => {
            const nodeRef = signal<HTMLElement | null>(null);
            expect(nodeRef.get()).toBe(null);
            const node = new IntrinsicElement("button", { ref: nodeRef }, []).createNode();
            expect(nodeRef.get()).toBe(node);
        });
        it("writes element to a function ref", () => {
            const nodeRef = vi.fn();
            const node = new IntrinsicElement("button", { ref: nodeRef }, []).createNode();
            expect(nodeRef).toHaveBeenCalledExactlyOnceWith(node);
        });
    });
});
