/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */


import { Observable, type SubscriptionObserver } from "@kayahr/observable";
import { signal } from "@kayahr/signal";
import { describe, it } from "node:test";

import { FragmentElement } from "../main/FragmentElement.ts";
import { IntrinsicElement } from "../main/IntrinsicElement.ts";
import { ref } from "../main/utils/Reference.ts";
import { assertEquals, assertGarbageCollected, assertInstanceOf, assertNotNull, assertNull, assertSame } from "@kayahr/assert";

describe("IntrinsicElement", () => {
    describe("createNode", () => {
        it("returns HTML node with given properties and children", () => {
            const element = new IntrinsicElement("div", { id: "foo", class: "bar" }, [ 1, "test" ]);
            const node = element.createNode() as HTMLElement;
            assertInstanceOf(node, HTMLDivElement);
            assertSame(node.outerHTML, '<div id="foo" class="bar">1test</div>');
        });
        it("can create HTML node without properties and children", () => {
            const element = new IntrinsicElement("div", {}, []);
            const node = element.createNode() as HTMLElement;
            assertInstanceOf(node, HTMLDivElement);
            assertSame(node.outerHTML, "<div></div>");
        });
        it("connects event listener functions", (context) => {
            const fn = context.mock.fn();
            const element = new IntrinsicElement("button", { onclick: fn }, []);
            const node = element.createNode() as HTMLButtonElement;
            assertInstanceOf(node, HTMLButtonElement);
            assertSame(node.outerHTML, "<button></button>");
            assertSame(fn.mock.callCount(), 0);
            node.click();
            assertSame(fn.mock.callCount(), 1);
        });
        it("can dynamically update event listener", (context) => {
            const fn1 = context.mock.fn();
            const fn2 = context.mock.fn();
            const onClick = signal(fn1);
            const element = new IntrinsicElement("button", { onclick: onClick }, []);
            const node = element.createNode() as HTMLButtonElement;
            assertInstanceOf(node, HTMLButtonElement);
            assertSame(node.outerHTML, "<button></button>");
            assertSame(fn1.mock.callCount(), 0);
            assertSame(fn2.mock.callCount(), 0);
            node.click();
            assertSame(fn1.mock.callCount(), 1);
            assertSame(fn2.mock.callCount(), 0);
            fn1.mock.resetCalls();
            onClick.set(fn2);
            node.click();
            assertSame(fn1.mock.callCount(), 0);
            assertSame(fn2.mock.callCount(), 1);
        });
        it("can unset event listener", (context) => {
            const fn = context.mock.fn();
            const onClick = signal<Function | null>(fn);
            const element = new IntrinsicElement("button", { onclick: onClick }, []);
            const node = element.createNode() as HTMLButtonElement;
            assertInstanceOf(node, HTMLButtonElement);
            assertSame(node.outerHTML, "<button></button>");
            assertSame(fn.mock.callCount(), 0);
            node.click();
            assertSame(fn.mock.callCount(), 1);
            fn.mock.resetCalls();
            onClick.set(null);
            node.click();
            assertSame(fn.mock.callCount(), 0);
        });
        it("removes attributes when value is null or undefined", () => {
            const value = signal<unknown>("test");
            const element = new IntrinsicElement("div", { id: value, class: "cls" }, []);
            const node = element.createNode() as HTMLDivElement;
            assertSame(node.outerHTML, '<div id="test" class="cls"></div>');
            value.set(null);
            assertSame(node.outerHTML, '<div class="cls"></div>');
            value.set(4);
            assertSame(node.outerHTML, '<div class="cls" id="4"></div>');
            value.set(undefined);
            assertSame(node.outerHTML, '<div class="cls"></div>');
        });
        it("can set attribute values via promise", async () => {
            const promise = new Promise(resolve => setTimeout(() => resolve("foo"), 0));
            const element = new IntrinsicElement("div", { id: promise, class: "cls" }, []);
            const node = element.createNode() as HTMLDivElement;
            assertSame(node.outerHTML, '<div class="cls"></div>');
            await promise;
            assertSame(node.outerHTML, '<div class="cls" id="foo"></div>');
        });
        it("can set attribute values via function call", () => {
            const element = new IntrinsicElement("div", { id: () => 123, class: "cls" }, []);
            const node = element.createNode() as HTMLDivElement;
            assertSame(node.outerHTML, '<div id="123" class="cls"></div>');
        });
        it("can set attribute values from recursive functions", () => {
            const func1 = (): string => "test";
            const func2 = (): Function => func1;
            const func3 = (): Function => func2;
            const element = new IntrinsicElement("div", { id: func3 }, []);
            const node = element.createNode() as HTMLDivElement;
            assertSame(node.outerHTML, '<div id="test"></div>');
        });
        it("can add/remove attributes via boolean", () => {
            const disabled = signal(false);
            const element = new IntrinsicElement("button", { disabled }, []);
            const node = element.createNode() as HTMLButtonElement;
            assertSame(node.outerHTML, "<button></button>");
            disabled.set(true);
            assertSame(node.outerHTML, '<button disabled=""></button>');
            disabled.set(false);
            assertSame(node.outerHTML, "<button></button>");
        });
        it("can set attribute values via observable", () => {
            let observer = null as null | SubscriptionObserver<number>;
            const observable = new Observable<number>(arg => { observer = arg; });
            const element = new IntrinsicElement("span", { id: observable }, []);
            const node = element.createNode() as HTMLSpanElement;
            assertInstanceOf(node, HTMLSpanElement);
            assertEquals(node.outerHTML, "<span></span>");
            observer?.next(1);
            assertEquals(node.outerHTML, '<span id="1"></span>');
            observer?.next(2);
            assertEquals(node.outerHTML, '<span id="2"></span>');
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
            assertEquals(node?.outerHTML, "<span></span>");
            observer?.next(1);
            assertEquals(node?.outerHTML, '<span id="1"></span>');
            await assertGarbageCollected(new WeakRef(node), () => { node = null; element.destroy(); });
            assertNotNull(observer);
            observer?.next(2);
            assertNull(observer);
        });
        it("can set style attribute", () => {
            const node = new IntrinsicElement("div", { style: { color: "red", "font-size": "12px" } }, []).createNode() as HTMLDivElement;
            assertSame(node.outerHTML, '<div style="color: red; font-size: 12px"></div>');
        });
        it("can dynamically set style attribute", () => {
            const color = signal("red");
            const node = new IntrinsicElement("div", { style: () => ({ color: color.get(), "font-size": "12px" }) }, []).createNode() as HTMLDivElement;
            assertSame(node.outerHTML, '<div style="color: red; font-size: 12px"></div>');
            color.set("blue");
            assertSame(node.outerHTML, '<div style="color: blue; font-size: 12px"></div>');
        });
        it("resolves null child to empty text node", () => {
            const node = new IntrinsicElement("div", {}, [ null ]).createNode() as HTMLElement;
            assertEquals(node.outerHTML, "<div></div>");
            assertSame(node.childNodes.length, 1);
            assertInstanceOf(node.firstChild, Text);
            assertSame(node.firstChild.textContent, "");
        });
        it("passes through already resolved children", () => {
            const child = document.createElement("span");
            child.setAttribute("class", "bar");
            child.appendChild(document.createTextNode("foo"));
            const node = new IntrinsicElement("div", {}, [ child ]).createNode() as HTMLElement;
            assertSame(node.childNodes.length, 1);
            assertSame(node.childNodes[0], child);
            assertSame(node.outerHTML, '<div><span class="bar">foo</span></div>');
        });
        it("resolves undefined child to empty text node", () => {
            const node = new IntrinsicElement("div", {}, [ undefined ]).createNode() as HTMLElement;
            assertEquals(node.outerHTML, "<div></div>");
            assertSame(node.childNodes.length, 1);
            assertInstanceOf(node.firstChild, Text);
            assertSame(node.firstChild.textContent, "");
        });
        it("resolves string child to text node", () => {
            const node = new IntrinsicElement("div", {}, [ "test" ]).createNode() as HTMLElement;
            assertEquals(node.outerHTML, "<div>test</div>");
            assertSame(node.childNodes.length, 1);
            assertInstanceOf(node.firstChild, Text);
            assertSame(node.firstChild.textContent, "test");
        });
        it("resolves number child to text node", () => {
            const node = new IntrinsicElement("div", {}, [ 123 ]).createNode() as HTMLElement;
            assertEquals(node.outerHTML, "<div>123</div>");
            assertSame(node.childNodes.length, 1);
            assertInstanceOf(node.firstChild, Text);
            assertSame(node.firstChild.textContent, "123");
        });
        it("resolves boolean children to empty text node", () => {
            const node = new IntrinsicElement("div", {}, [ true, ":", false ]).createNode() as HTMLElement;
            assertEquals(node.outerHTML, "<div>true:false</div>");
            assertSame(node.childNodes.length, 3);
            assertInstanceOf(node.childNodes[0], Text);
            assertSame(node.childNodes[0].textContent, "true");
            assertInstanceOf(node.childNodes[2], Text);
            assertSame(node.childNodes[2].textContent, "false");
        });
        it("resolves observable child with empty text node which is replaced later with new node", () => {
            let next = (value: string) => {};
            const observable = new Observable<string>(observer => { next = value => observer.next(value); });
            const node = new IntrinsicElement("div", {}, [ observable ]).createNode() as HTMLElement;
            assertSame(node.outerHTML, "<div><!----></div>");
            next("foo");
            assertSame(node.outerHTML, "<div>foo</div>");
            next("bar");
            assertSame(node.outerHTML, "<div>bar</div>");
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
            assertEquals(node.outerHTML, "<span><!----></span>");
            observer?.next(1);
            assertEquals(node.outerHTML, "<span>1</span>");
            await assertGarbageCollected(new WeakRef(node), () => { element.destroy(); node = null; });
            assertNull(observer);
        });
        it("resolves promise child with empty text node which is replaced later with new node", async () => {
            const promise = new Promise<string>(resolve => setTimeout(() => resolve("foo"), 0));
            const node = new IntrinsicElement("div", {}, [ promise ]).createNode() as HTMLElement;
            assertSame(node.outerHTML, "<div><!----></div>");
            await promise;
            assertSame(node.outerHTML, "<div>foo</div>");
        });
        it("resolves signal child with text node with initial value and replaces it later with new node", () => {
            const sig = signal(123);
            const node = new IntrinsicElement("div", {}, [ sig ]).createNode() as HTMLElement;
            assertSame(node.outerHTML, "<div>123</div>");
            sig.set(234);
            assertSame(node.outerHTML, "<div>234</div>");
            sig.set(345);
            assertSame(node.outerHTML, "<div>345</div>");
        });
        it("resolves synchronous children correctly", () => {
            const node = new IntrinsicElement("div", {}, [ null, undefined, "test", 23, true, false ]).createNode() as HTMLElement;
            assertInstanceOf(node, HTMLDivElement);
            assertSame(node.childNodes.length, 6);
            assertInstanceOf(node.childNodes[0], Text);
            assertInstanceOf(node.childNodes[1], Text);
            assertInstanceOf(node.childNodes[2], Text);
            assertInstanceOf(node.childNodes[3], Text);
            assertInstanceOf(node.childNodes[4], Text);
            assertInstanceOf(node.childNodes[5], Text);
            assertSame(node.childNodes[0].textContent, "");
            assertSame(node.childNodes[1].textContent, "");
            assertSame(node.childNodes[2].textContent, "test");
            assertSame(node.childNodes[3].textContent, "23");
            assertSame(node.childNodes[4].textContent, "true");
            assertSame(node.childNodes[5].textContent, "false");
        });
        it("resolves asynchronous children correctly", async () => {
            let next = (value: string) => {};
            let resolve = (value: number) => {};
            const observable = new Observable<string>(observer => { next = value => observer.next(value); });
            const promise = new Promise<number>(resolveFunc => { resolve = resolveFunc; });
            const sig = signal(true);
            const node = new IntrinsicElement("div", {}, [ observable, ":", promise, ":", sig ]).createNode() as HTMLElement;
            assertSame(node.outerHTML, "<div><!---->:<!---->:true</div>");
            next("foo");
            assertSame(node.outerHTML, "<div>foo:<!---->:true</div>");
            resolve(123);
            await promise;
            assertSame(node.outerHTML, "<div>foo:123:true</div>");
            sig.set(false);
            assertSame(node.outerHTML, "<div>foo:123:false</div>");
        });
        it("resolves function children", () => {
            const func = (): string => "test";
            const node = new IntrinsicElement("span", {}, [ func ]).createNode() as HTMLElement;
            assertSame(node.outerHTML, "<span>test</span>");
        });
        it("resolves children recursively", () => {
            const func1 = (): string => "test";
            const func2 = (): Function => func1;
            const func3 = (): Function => func2;
            const node = new IntrinsicElement("span", {}, [ func3 ]).createNode() as HTMLElement;
            assertSame(node.outerHTML, "<span>test</span>");
        });
        it("tracks signals dependencies in function children", () => {
            const value = signal(1);
            const func = () => value.get() * 2;
            const node = new IntrinsicElement("span", {}, [ func ]).createNode() as HTMLElement;
            assertSame(node.outerHTML, "<span>2</span>");
            value.set(2);
            assertSame(node.outerHTML, "<span>4</span>");
        });
        it("resolves other JSX elements", () => {
            const child = new IntrinsicElement("span", {}, [ "test" ]);
            const node = new IntrinsicElement("div", {}, [ child ]).createNode() as HTMLElement;
            assertSame(node.outerHTML, "<div><span>test</span></div>");
        });
        it("resolves JSX fragment child", () => {
            const child = new FragmentElement([ 123, " ", true ]);
            const node = new IntrinsicElement("div", {}, [ child ]).createNode() as HTMLElement;
            assertSame(node.innerHTML, "<!--<>-->123 true<!--</>-->");
        });
        it("asynchronously resolves JSX fragment child from promise", async () => {
            const child = new Promise(resolve => setTimeout(() => resolve(new FragmentElement([ 123, " ", true ])), 0));
            const node = new IntrinsicElement("div", {}, [ child ]).createNode() as HTMLElement;
            assertSame(node.innerHTML, "<!---->");
            await child;
            assertSame(node.innerHTML, "<!--<>-->123 true<!--</>-->");
        });
        it("asynchronously resolves JSX fragment child from observable", () => {
            const child = signal(new FragmentElement([ 123, " ", true ]));
            const node = new IntrinsicElement("div", {}, [ child ]).createNode() as HTMLElement;
            assertSame(node.innerHTML, "<!--<>-->123 true<!--</>-->");
            child.set(new FragmentElement([ false, " ", 5 ]));
            assertSame(node.innerHTML, "<!--<>-->false 5<!--</>-->");
        });
        it("recursively resolves array children to fragments", () => {
            const node = new IntrinsicElement("div", {}, [ [ 1, 2, [ 3, 4 ] ] ]).createNode() as HTMLElement;
            assertSame(node.innerHTML, "<!--<>-->12<!--<>-->34<!--</>--><!--</>-->");
        });
        it("resolves array with only one value", () => {
            const node = new IntrinsicElement("div", {}, [ [ 1 ], [ 2 ] ]).createNode() as HTMLElement;
            assertSame(node.innerHTML, "<!--<>-->1<!--</>--><!--<>-->2<!--</>-->");
        });
        it("writes element to a Reference ref", () => {
            const nodeRef = ref();
            assertSame(nodeRef.get(), null);
            const node = new IntrinsicElement("button", { ref: nodeRef }, []).createNode();
            assertSame(nodeRef.get(), node);
        });
        it("writes element to a Signal ref", () => {
            const nodeRef = signal<HTMLElement | null>(null);
            assertSame(nodeRef.get(), null);
            const node = new IntrinsicElement("button", { ref: nodeRef }, []).createNode();
            assertSame(nodeRef.get(), node);
        });
        it("writes element to a function ref", (context) => {
            const nodeRef = context.mock.fn();
            const node = new IntrinsicElement("button", { ref: nodeRef }, []).createNode();
            assertSame(nodeRef.mock.callCount(), 1);
            assertSame(nodeRef.mock.calls[0].arguments[0], node);
        });
    });
});
