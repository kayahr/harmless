/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import "./dom.ts";
import { describe, it } from "node:test";
import { Observable, type SubscriptionObserver } from "@kayahr/observable";
import { assertInstanceOf, assertSame, assertThrowWithMessage } from "@kayahr/assert";
import { dispose } from "@kayahr/scope";
import { SignalError, createEffect, createMemo, createSignal } from "@kayahr/signal";
import { component } from "../main/component.ts";
import { For } from "../main/components/For.ts";
import { ComponentContext, type NoProps } from "../main/jsx.ts";
import { RenderedBase } from "../main/rendered/RenderedBase.ts";
import { render } from "../main/render.ts";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";

describe("render", () => {
    it("renders empty roots as disposable document fragments", () => {
        const node = render(null);
        const host = document.createElement("div");

        assertInstanceOf(node, DocumentFragment);
        assertSame(node.childNodes.length, 2);
        assertSame(node.textContent, "");

        host.appendChild(node);
        assertSame(host.textContent, "");

        dispose(node);
        assertSame(host.textContent, "");
    });

    it("renders a function component into a DOM node", () => {
        function HelloWorld() {
            return <h1>Hello World</h1>;
        }

        const node = render(<HelloWorld />);
        assertInstanceOf(node, HTMLHeadingElement);
        assertSame(node.textContent, "Hello World");
    });

    it("renders a class component into a DOM node", () => {
        class HelloWorld {
            readonly #name: string;

            public constructor(props: { name: string }) {
                this.#name = props.name;
            }

            public render() {
                return <h1>Hello {this.#name}</h1>;
            }
        }

        const node = render(<HelloWorld name="World" />);
        assertInstanceOf(node, HTMLHeadingElement);
        assertSame(node.textContent, "Hello World");
    });

    it("renders a class component with an instance render field", () => {
        class HelloWorld {
            readonly #name: string;

            public constructor(props: { name: string }) {
                this.#name = props.name;
            }

            public render = () => <h1>Hello {this.#name}</h1>;
        }

        const node = render(<HelloWorld name="Field" />);
        assertInstanceOf(node, HTMLHeadingElement);
        assertSame(node.textContent, "Hello Field");
    });

    it("disposes class component instances when the rendered root is disposed", () => {
        let disposed = 0;

        class HelloWorld {
            public render() {
                return <h1>Hello World</h1>;
            }

            public [Symbol.dispose]() {
                disposed++;
            }
        }

        const node = render(<HelloWorld />);

        assertInstanceOf(node, HTMLHeadingElement);
        assertSame(disposed, 0);

        dispose(node);

        assertSame(disposed, 1);
    });

    it("disposes function components registered through onDispose", () => {
        let disposed = 0;

        function HelloWorld(props: NoProps, context: ComponentContext) {
            context.onDispose(() => {
                disposed++;
            });
            return <h1>Hello World</h1>;
        }
        component(HelloWorld, [ ComponentContext ]);

        const node = render(<HelloWorld />);

        assertInstanceOf(node, HTMLHeadingElement);
        assertSame(disposed, 0);

        dispose(node);

        assertSame(disposed, 1);
    });

    it("injects component context automatically for unconfigured function components", () => {
        let disposed = 0;

        function HelloWorld(props: NoProps, context: ComponentContext) {
            context.onDispose(() => {
                disposed++;
            });
            return <h1>Hello World</h1>;
        }

        const node = render(<HelloWorld />);

        assertInstanceOf(node, HTMLHeadingElement);
        assertSame(disposed, 0);

        dispose(node);

        assertSame(disposed, 1);
    });

    it("disposes class component instances when reactive branches remove them", () => {
        const [ visible, setVisible ] = createSignal(true);
        let disposed = 0;

        class HelloWorld {
            public render() {
                return <h1>Hello World</h1>;
            }

            public [Symbol.dispose]() {
                disposed++;
            }
        }

        const node = render(() => visible() ? <HelloWorld /> : null);

        assertInstanceOf(node, DocumentFragment);
        assertSame(disposed, 0);

        setVisible(false);

        assertSame(disposed, 1);
    });

    it("disposes class component constructors registered through onDispose", () => {
        let disposed = 0;

        class HelloWorld {
            public constructor(props: NoProps, context: ComponentContext) {
                void props;
                context.onDispose(() => {
                    disposed++;
                });
            }

            public render() {
                return <h1>Hello World</h1>;
            }
        }
        component(HelloWorld, [ ComponentContext ]);

        const node = render(<HelloWorld />);

        assertInstanceOf(node, HTMLHeadingElement);
        assertSame(disposed, 0);

        dispose(node);

        assertSame(disposed, 1);
    });

    it("injects component context automatically for unconfigured class components", () => {
        let disposed = 0;

        class HelloWorld {
            public constructor(props: NoProps, context: ComponentContext) {
                void props;
                context.onDispose(() => {
                    disposed++;
                });
            }

            public render() {
                return <h1>Hello World</h1>;
            }
        }

        const node = render(<HelloWorld />);

        assertInstanceOf(node, HTMLHeadingElement);
        assertSame(disposed, 0);

        dispose(node);

        assertSame(disposed, 1);
    });

    it("renders boolean roots as text nodes", () => {
        const trueNode = render(true);
        const falseNode = render(false);

        assertInstanceOf(trueNode, Text);
        assertInstanceOf(falseNode, Text);
        assertSame(trueNode.textContent, "true");
        assertSame(falseNode.textContent, "false");
    });

    it("updates signal getter children fine-grained without rerendering the parent element", () => {
        const [ value, setValue ] = createSignal("Hello");
        const node = render(<h1>{value}</h1>);

        assertInstanceOf(node, HTMLHeadingElement);
        const element = node;
        const originalElement = element;

        assertSame(element.textContent, "Hello");

        setValue("World");

        assertSame(element.textContent, "World");
        assertSame(element === originalElement, true);
    });

    it("updates computed child thunks reactively", () => {
        const [ time, setTime ] = createSignal("10:00");
        const node = render(<div>{() => `Time: ${time()}`}</div>);

        assertSame(node.textContent, "Time: 10:00");

        setTime("10:01");

        assertSame(node.textContent, "Time: 10:01");
    });

    it("resolves nested signals, promises and observables in children", async () => {
        const [ leaf, setLeaf ] = createSignal("Arthur");
        let observer!: SubscriptionObserver<() => string>;
        let unsubscribes = 0;
        const observable = new Observable<() => string>(currentObserver => {
            observer = currentObserver;
            return () => {
                unsubscribes++;
            };
        });
        let resolve!: (value: Observable<() => string>) => void;
        const promise = new Promise<Observable<() => string>>(callback => {
            resolve = callback;
        });
        const [ value ] = createSignal(promise);
        const node = render(<div>{value}</div>);

        assertSame(node.textContent, "");

        resolve(observable);
        await promise;
        assertSame(node.textContent, "");

        observer.next(leaf);
        assertSame(node.textContent, "Arthur");

        setLeaf("Tricia");
        assertSame(node.textContent, "Tricia");

        dispose(node);
        assertSame(unsubscribes, 1);
    });

    it("renders and updates boolean children as text", () => {
        const [ value, setValue ] = createSignal(false);
        const node = render(<div>{value}</div>);

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.textContent, "false");

        setValue(true);
        assertSame(node.textContent, "true");
    });

    it("treats non-event function props on intrinsic elements as reactive getters", () => {
        const [ active, setActive ] = createSignal(false);
        const node = render(<div class={() => active() ? "on" : "off"} />);

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.className, "off");

        setActive(true);

        assertSame(node.className, "on");
    });

    it("flattens class strings, Boolean maps and nested arrays", () => {
        const node = render(<div class={[ "card", false, null, undefined, [
            "large",
            { active: true, disabled: false },
            [ "selected" ]
        ] ]} />);

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.className, "card large active selected");

        dispose(node);
    });

    it("updates complete composite class values reactively", () => {
        const [ active, setActive ] = createSignal(false);
        const [ disabled, setDisabled ] = createSignal(false);
        const node = render(<div class={() => [
            "card",
            active() && "active",
            { disabled: disabled() }
        ]} />);

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.className, "card");

        setActive(true);
        assertSame(node.className, "card active");

        setDisabled(true);
        assertSame(node.className, "card active disabled");

        setActive(false);
        assertSame(node.className, "card disabled");

        dispose(node);
        setDisabled(false);
        assertSame(node.className, "card disabled");
    });

    it("resolves nested signals, promises and observables in intrinsic properties", async () => {
        const [ leaf, setLeaf ] = createSignal("Arthur");
        let observer!: SubscriptionObserver<() => string>;
        const observable = new Observable<() => string>(currentObserver => {
            observer = currentObserver;
        });
        let resolve!: (value: Observable<() => string>) => void;
        const promise = new Promise<Observable<() => string>>(callback => {
            resolve = callback;
        });
        const [ value ] = createSignal(promise);
        const node = render(<input value={value} />);

        assertInstanceOf(node, HTMLInputElement);
        assertSame(node.value, "");

        resolve(observable);
        await promise;
        assertSame(node.value, "");

        observer.next(leaf);
        assertSame(node.value, "Arthur");

        setLeaf("Tricia");
        assertSame(node.value, "Tricia");

        dispose(node);
    });

    it("unsubscribes replaced and disposed observable property values", () => {
        let firstObserver!: SubscriptionObserver<string>;
        let secondObserver!: SubscriptionObserver<string>;
        let firstUnsubscribes = 0;
        let secondUnsubscribes = 0;
        const first = new Observable<string>(observer => {
            firstObserver = observer;
            return () => {
                firstUnsubscribes++;
            };
        });
        const second = new Observable<string>(observer => {
            secondObserver = observer;
            return () => {
                secondUnsubscribes++;
            };
        });
        const [ value, setValue ] = createSignal(first);
        const node = render(<div title={value} />);

        assertInstanceOf(node, HTMLDivElement);
        firstObserver.next("first");
        assertSame(node.title, "first");

        setValue(second);
        assertSame(firstUnsubscribes, 1);
        assertSame(node.title, "");

        secondObserver.next("second");
        assertSame(node.title, "second");

        dispose(node);
        assertSame(firstUnsubscribes, 1);
        assertSame(secondUnsubscribes, 1);
    });

    it("ignores promise property values after an outer signal switches sources", async () => {
        let resolveFirst!: (value: string) => void;
        let resolveSecond!: (value: string) => void;
        const first = new Promise<string>(resolve => {
            resolveFirst = resolve;
        });
        const second = new Promise<string>(resolve => {
            resolveSecond = resolve;
        });
        const [ value, setValue ] = createSignal(first);
        const node = render(<div title={value} />);

        assertInstanceOf(node, HTMLDivElement);
        setValue(second);
        resolveFirst("stale");
        await first;
        assertSame(node.title, "");

        resolveSecond("current");
        await second;
        assertSame(node.title, "current");

        dispose(node);
    });

    it("treats namespaced event handler props as event listeners instead of reactive getters", () => {
        let calls = 0;
        const handler = () => {
            calls++;
        };
        const node = render(<button on:click={handler}>Click</button>);

        assertInstanceOf(node, HTMLButtonElement);
        assertSame(calls, 0);

        node.dispatchEvent(new Event("click"));

        assertSame(calls, 1);
    });

    it("keeps namespaced intrinsic event names exact", () => {
        let calls = 0;
        const node = render(<button on:Click={() => {
            calls++;
        }}>Click</button>);

        assertInstanceOf(node, HTMLButtonElement);

        node.dispatchEvent(new Event("click"));
        assertSame(calls, 0);

        node.dispatchEvent(new Event("Click"));
        assertSame(calls, 1);
    });

    it("passes function props to components unchanged", () => {
        let calls = 0;
        const formatter = (value: number) => {
            calls++;
            return `#${value}`;
        };

        function Receiver(props: { formatter: (value: number) => string }) {
            assertSame(props.formatter, formatter);
            return <div>ok</div>;
        }

        const node = render(<Receiver formatter={formatter} />);

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.textContent, "ok");
        assertSame(calls, 0);
    });

    it("passes namespaced event-like props to components unchanged", () => {
        let calls = 0;
        const handler = () => {
            calls++;
        };

        function Receiver(props: { "on:trigger": () => void }) {
            assertSame(props["on:trigger"], handler);
            return <div>ok</div>;
        }

        const node = render(<Receiver on:trigger={handler} />);

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.textContent, "ok");
        assertSame(calls, 0);
    });

    it("creates svg elements in the svg namespace", () => {
        const node = render(
            <svg viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="4" />
            </svg>
        );

        assertInstanceOf(node, Element);
        assertSame(node.namespaceURI, SVG_NAMESPACE);
        const circle = node.firstElementChild;
        if (circle == null) {
            throw new Error("Expected svg child");
        }
        assertSame(circle.namespaceURI, SVG_NAMESPACE);
        assertSame(circle.getAttribute("cx"), "5");
    });

    it("keeps component output inside svg in the svg namespace", () => {
        function Dot() {
            return <circle cx="6" cy="6" r="3" />;
        }

        const node = render(
            <svg viewBox="0 0 12 12">
                <Dot />
            </svg>
        );

        assertInstanceOf(node, Element);
        assertSame(node.namespaceURI, SVG_NAMESPACE);
        const circle = node.firstElementChild;
        if (circle == null) {
            throw new Error("Expected component circle");
        }
        assertSame(circle.namespaceURI, SVG_NAMESPACE);
    });

    it("keeps class component output inside svg in the svg namespace", () => {
        class Dot {
            public render() {
                return <circle cx="6" cy="6" r="3" />;
            }
        }

        const node = render(
            <svg viewBox="0 0 12 12">
                <Dot />
            </svg>
        );

        assertInstanceOf(node, Element);
        assertSame(node.namespaceURI, SVG_NAMESPACE);
        const circle = node.firstElementChild;
        if (circle == null) {
            throw new Error("Expected component circle");
        }
        assertSame(circle.namespaceURI, SVG_NAMESPACE);
    });

    it("resets nested top-level render calls back to the html namespace", () => {
        let nestedNamespace: string | null = null;

        function NestedRender() {
            const nested = render(<div>inner</div>);
            if (!(nested instanceof Element)) {
                throw new Error("Expected nested element");
            }
            nestedNamespace = nested.namespaceURI;
            return <circle cx="5" cy="5" r="4" />;
        }

        const node = render(
            <svg viewBox="0 0 10 10">
                <NestedRender />
            </svg>
        );

        assertInstanceOf(node, Element);
        assertSame(node.namespaceURI, SVG_NAMESPACE);
        assertSame(nestedNamespace, HTML_NAMESPACE);
    });

    it("keeps dynamic svg children in the svg namespace", () => {
        const [ radius, setRadius ] = createSignal("4");
        const node = render(
            <svg viewBox="0 0 10 10">
                {() => <circle cx="5" cy="5" r={radius} />}
            </svg>
        );

        assertInstanceOf(node, Element);
        assertSame(node.namespaceURI, SVG_NAMESPACE);
        const svg = node;
        let circle = svg.firstElementChild;
        if (circle == null) {
            throw new Error("Expected dynamic circle");
        }
        assertSame(circle.namespaceURI, SVG_NAMESPACE);
        assertSame(circle.getAttribute("r"), "4");

        setRadius("2");

        circle = svg.firstElementChild;
        if (circle == null) {
            throw new Error("Expected updated dynamic circle");
        }
        assertSame(circle.namespaceURI, SVG_NAMESPACE);
        assertSame(circle.getAttribute("r"), "2");
    });

    it("switches foreignObject children back to the html namespace", () => {
        const node = render(
            <svg viewBox="0 0 20 20">
                <foreignObject x="0" y="0" width="20" height="20">
                    <div>Hello</div>
                </foreignObject>
            </svg>
        );

        assertInstanceOf(node, Element);
        assertSame(node.namespaceURI, SVG_NAMESPACE);
        const foreignObject = node.firstElementChild;
        if (foreignObject == null) {
            throw new Error("Expected foreignObject");
        }
        assertSame(foreignObject.namespaceURI, SVG_NAMESPACE);
        const div = foreignObject.firstElementChild;
        if (div == null) {
            throw new Error("Expected html child");
        }
        assertSame(div.namespaceURI, HTML_NAMESPACE);
        assertSame(div.textContent, "Hello");
    });

    it("keeps For rows inside svg in the svg namespace", () => {
        const [ radii, setRadii ] = createSignal([ "4", "2" ]);
        const node = render(
            <svg viewBox="0 0 20 10">
                <For of={radii} key="index">
                    {(radius, index) => <circle cx={() => index() === 0 ? "5" : "15"} cy="5" r={radius} />}
                </For>
            </svg>
        );

        assertInstanceOf(node, Element);
        assertSame(node.namespaceURI, SVG_NAMESPACE);
        const svg = node;
        const circlesBefore = Array.from(svg.children);
        assertSame(circlesBefore.length, 2);
        assertSame(circlesBefore[0].namespaceURI, SVG_NAMESPACE);
        assertSame(circlesBefore[1].namespaceURI, SVG_NAMESPACE);
        assertSame(circlesBefore[0].getAttribute("r"), "4");
        assertSame(circlesBefore[1].getAttribute("r"), "2");

        setRadii([ "3", "1", "5" ]);

        const circlesAfter = Array.from(svg.children);
        assertSame(circlesAfter.length, 3);
        assertSame(circlesAfter[0].namespaceURI, SVG_NAMESPACE);
        assertSame(circlesAfter[1].namespaceURI, SVG_NAMESPACE);
        assertSame(circlesAfter[2].namespaceURI, SVG_NAMESPACE);
        assertSame(circlesAfter[0].getAttribute("r"), "3");
        assertSame(circlesAfter[1].getAttribute("r"), "1");
        assertSame(circlesAfter[2].getAttribute("r"), "5");
    });

    it("writes and removes namespaced svg attributes with setAttributeNS", () => {
        const [ href, setHref ] = createSignal<unknown>("#first");
        const node = render(
            <svg>
                <use xlink:href={href} />
            </svg>
        );

        assertInstanceOf(node, Element);
        const use = node.firstElementChild;
        if (use == null) {
            throw new Error("Expected use element");
        }
        assertSame(use.getAttributeNS(XLINK_NAMESPACE, "href"), "#first");

        setHref("#second");
        assertSame(use.getAttributeNS(XLINK_NAMESPACE, "href"), "#second");

        setHref(null);
        assertSame(use.hasAttributeNS(XLINK_NAMESPACE, "href"), false);
    });

    it("writes and removes xml namespaced attributes", () => {
        const [ space, setSpace ] = createSignal<unknown>("preserve");
        const node = render(
            <svg>
                <text xml:space={space}>x</text>
            </svg>
        );

        assertInstanceOf(node, Element);
        const text = node.firstElementChild;
        if (text == null) {
            throw new Error("Expected text element");
        }
        assertSame(text.getAttributeNS(XML_NAMESPACE, "space"), "preserve");

        setSpace(null);
        assertSame(text.hasAttributeNS(XML_NAMESPACE, "space"), false);
    });

    it("treats unsupported prefixed attributes as normal attributes", () => {
        const [ value, setValue ] = createSignal<unknown>("one");
        const node = render(
            <svg>
                <text demo:value={value}>x</text>
            </svg>
        );

        assertInstanceOf(node, Element);
        const text = node.firstElementChild;
        if (text == null) {
            throw new Error("Expected text element");
        }
        assertSame(text.getAttribute("demo:value"), "one");

        setValue("two");
        assertSame(text.getAttribute("demo:value"), "two");

        setValue(null);
        assertSame(text.hasAttribute("demo:value"), false);
    });

    it("creates mathml elements in the mathml namespace", () => {
        const node = render(
            <math>
                <mi>x</mi>
                <mo>+</mo>
                <mn>1</mn>
            </math>
        );

        assertInstanceOf(node, Element);
        assertSame(node.namespaceURI, MATHML_NAMESPACE);
        const children = Array.from(node.children);
        assertSame(children.length, 3);
        assertSame(children[0].namespaceURI, MATHML_NAMESPACE);
        assertSame(children[1].namespaceURI, MATHML_NAMESPACE);
        assertSame(children[2].namespaceURI, MATHML_NAMESPACE);
        assertSame(node.textContent, "x+1");
    });

    it("keeps component output inside mathml in the mathml namespace", () => {
        function Token() {
            return <mi>x</mi>;
        }

        const node = render(
            <math>
                <Token />
            </math>
        );

        assertInstanceOf(node, Element);
        assertSame(node.namespaceURI, MATHML_NAMESPACE);
        const token = node.firstElementChild;
        if (token == null) {
            throw new Error("Expected component math child");
        }
        assertSame(token.namespaceURI, MATHML_NAMESPACE);
    });

    it("keeps For rows inside mathml in the mathml namespace", () => {
        const [ items, setItems ] = createSignal([ "x", "y" ]);
        const node = render(
            <math>
                <For of={items} key="index">
                    {item => <mi>{item}</mi>}
                </For>
            </math>
        );

        assertInstanceOf(node, Element);
        assertSame(node.namespaceURI, MATHML_NAMESPACE);
        let tokens = Array.from(node.children);
        assertSame(tokens.length, 2);
        assertSame(tokens[0].namespaceURI, MATHML_NAMESPACE);
        assertSame(tokens[1].namespaceURI, MATHML_NAMESPACE);
        assertSame(node.textContent, "xy");

        setItems([ "y", "z", "x" ]);

        tokens = Array.from(node.children);
        assertSame(tokens.length, 3);
        assertSame(tokens[0].namespaceURI, MATHML_NAMESPACE);
        assertSame(tokens[1].namespaceURI, MATHML_NAMESPACE);
        assertSame(tokens[2].namespaceURI, MATHML_NAMESPACE);
        assertSame(node.textContent, "yzx");
    });

    it("disposes component-local memos and effects when a component branch is removed", () => {
        const [ visible, setVisible ] = createSignal(true);
        const [ value, setValue ] = createSignal("a");
        let memoRuns = 0;
        let effectRuns = 0;
        let cleanups = 0;
        let localMemo: (() => string) | undefined;

        function Local() {
            const upper = createMemo(() => {
                memoRuns++;
                return value().toUpperCase();
            });
            localMemo = upper;

            createEffect(({ onCleanup }) => {
                effectRuns++;
                upper();
                onCleanup(() => {
                    cleanups++;
                });
            });

            return <span>{upper}</span>;
        }

        const node = render(<div>{() => visible() ? <Local /> : null}</div>);

        assertSame(node.textContent, "A");
        assertSame(memoRuns, 1);
        assertSame(effectRuns, 1);
        assertSame(cleanups, 0);

        setValue("b");
        assertSame(node.textContent, "B");
        assertSame(memoRuns, 2);
        assertSame(effectRuns, 2);
        assertSame(cleanups, 1);

        setVisible(false);
        assertSame(node.textContent, "");
        assertSame(effectRuns, 2);
        assertSame(cleanups, 2);
        if (localMemo == null) {
            throw new Error("Expected component memo to be assigned");
        }
        const removedMemo = localMemo;
        assertThrowWithMessage(() => removedMemo(), SignalError, "Cannot read a disposed memo");

        setValue("c");
        assertSame(node.textContent, "");
        assertSame(effectRuns, 2);
        assertSame(cleanups, 2);
    });

    it("disposes component-local memos and effects when the rendered component root is disposed", () => {
        const [ value, setValue ] = createSignal("a");
        let cleanups = 0;
        let localMemo: (() => string) | undefined;

        function Local() {
            const upper = createMemo(() => value().toUpperCase());
            localMemo = upper;

            createEffect(({ onCleanup }) => {
                upper();
                onCleanup(() => {
                    cleanups++;
                });
            });

            return <span>{upper}</span>;
        }

        const node = render(<Local />);

        assertSame(node.textContent, "A");

        dispose(node);

        assertSame(cleanups, 1);
        if (localMemo == null) {
            throw new Error("Expected component memo to be assigned");
        }
        const disposedMemo = localMemo;
        assertThrowWithMessage(() => disposedMemo(), SignalError, "Cannot read a disposed memo");

        setValue("b");
        assertSame(node.textContent, "A");
        assertSame(cleanups, 1);
    });

    it("renders raw DOM nodes without cloning and chains existing disposers", () => {
        let previousDisposals = 0;
        const text = document.createTextNode("Hello") as Text & Disposable;
        text[Symbol.dispose] = () => {
            previousDisposals++;
        };

        const node = render(text);

        assertSame(node, text);

        dispose(node);
        assertSame(previousDisposals, 1);

        dispose(node);
        assertSame(previousDisposals, 1);
    });

    it("does not adopt existing raw DOM node disposers for nested children", () => {
        let previousDisposals = 0;
        const child = document.createElement("span") as HTMLSpanElement & Disposable;
        child[Symbol.dispose] = () => {
            previousDisposals++;
        };

        const node = render(<div>{child}</div>);

        assertSame(typeof child[Symbol.dispose], "function");

        dispose(node);
        assertSame(previousDisposals, 0);

        child[Symbol.dispose]();
        assertSame(previousDisposals, 1);
    });

    it("supports nested raw DOM nodes without existing disposers", () => {
        const child = document.createElement("span");
        child.textContent = "inner";

        const node = render(<div>{child}</div>);

        assertSame(node.textContent, "inner");
        dispose(node);
        assertSame(node.textContent, "inner");
    });

    it("still runs a previous disposer when the Harmless cleanup throws", () => {
        let previousDisposals = 0;
        const node = document.createElement("div") as HTMLDivElement & Disposable;
        node[Symbol.dispose] = () => {
            previousDisposals++;
        };

        function Local() {
            createEffect(({ onCleanup }) => {
                onCleanup(() => {
                    throw new Error("scope cleanup");
                });
            });
            return node;
        }

        const rendered = render(<Local />);

        assertSame(rendered, node);
        assertThrowWithMessage(() => dispose(rendered), Error, "scope cleanup");
        assertSame(previousDisposals, 1);
    });

    it("surfaces errors from a previous disposer", () => {
        const text = document.createTextNode("Hello") as Text & Disposable;
        text[Symbol.dispose] = () => {
            throw new Error("previous cleanup");
        };

        const node = render(text);

        assertSame(node, text);
        assertThrowWithMessage(() => dispose(node), Error, "previous cleanup");
    });

    it("flattens aggregate errors from a pre-existing single-node disposer", () => {
        class CustomRendered extends RenderedBase {
            readonly #node = document.createTextNode("Hello") as Text & Disposable;

            public constructor() {
                super();
                this.#node[Symbol.dispose] = () => {
                    throw new AggregateError([ new Error("a"), new Error("b") ], "previous aggregate");
                };
            }

            protected override onInsert(parent: Node & ParentNode, before: ChildNode | null): void {
                if (before == null) {
                    parent.appendChild(this.#node);
                } else {
                    before.before(this.#node);
                }
            }

            public override getFirstNode(): ChildNode | null {
                return this.#node;
            }

            public override getLastNode(): ChildNode | null {
                return this.#node;
            }

            public override getSingleNode(): ChildNode | null {
                return this.#node;
            }
        }

        const node = render(new CustomRendered());
        let thrown: unknown = null;
        try {
            dispose(node);
        } catch (error) {
            thrown = error;
        }

        assertInstanceOf(thrown, AggregateError);
        assertSame(thrown.errors.length, 2);
        assertSame(thrown.errors[0] instanceof Error ? thrown.errors[0].message : String(thrown.errors[0]), "a");
        assertSame(thrown.errors[1] instanceof Error ? thrown.errors[1].message : String(thrown.errors[1]), "b");
    });

    it("renders single-entry arrays as anchored document fragments", () => {
        const node = render([ <span>only</span> ]);

        assertInstanceOf(node, DocumentFragment);
        assertSame(node.childNodes.length, 3);
        assertSame(node.textContent, "only");
    });

    it("renders top-level getter children as reactive document fragments", () => {
        const [ value, setValue ] = createSignal("Hello");
        const host = document.createElement("div");
        const node = render(() => value());

        assertInstanceOf(node, DocumentFragment);

        host.appendChild(node);
        assertSame(host.textContent, "Hello");

        setValue("World");
        assertSame(host.textContent, "World");

        dispose(node);
        setValue("Again");
        assertSame(host.textContent, "World");
    });

    it("supports disposal through the standard disposable interface", () => {
        const [ value, setValue ] = createSignal("Hello");
        const node = render(<h1>{value}</h1>);

        assertSame(node.textContent, "Hello");

        setValue("World");
        assertSame(node.textContent, "World");

        dispose(node);

        setValue("Again");
        assertSame(node.textContent, "World");
    });

    it("supports fragment roots by returning a document fragment", () => {
        const node = render(
            <>
                <span>a</span>
                <span>b</span>
            </>
        );

        assertInstanceOf(node, DocumentFragment);
        assertSame(node.childNodes.length, 4);
        assertSame(node.textContent, "ab");
    });

    it("flattens empty static fragments inside elements", () => {
        const node = render(
            <div>
                <>
                </>
            </div>
        );

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.textContent, "");
        assertSame(node.childNodes.length, 0);
    });

    it("flattens non-empty static fragments inside elements", () => {
        const node = render(
            <div>
                <>
                    <span>a</span>
                    <span>b</span>
                </>
            </div>
        );

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.textContent, "ab");
        assertSame(node.childNodes.length, 2);
    });

    it("keeps top-level fragment children reactive after insertion into the DOM", () => {
        const [ value, setValue ] = createSignal("Hello");
        const host = document.createElement("div");
        const fragment = render(
            <>
                <span>Value: </span>
                <strong>{value}</strong>
            </>
        );

        host.appendChild(fragment);
        assertSame(host.textContent, "Value: Hello");

        setValue("World");

        assertSame(host.textContent, "Value: World");

        dispose(fragment);

        setValue("Again");
        assertSame(host.textContent, "Value: World");
    });

    it("writes ref signals on mount and clears them on disposal", () => {
        const [ ref, setRef ] = createSignal<HTMLDivElement | null>(null);
        const node = render(<div ref={setRef} />);

        assertInstanceOf(node, HTMLDivElement);
        assertSame(ref(), node);

        dispose(node);

        assertSame(ref(), null);
    });

    it("ignores undefined refs", () => {
        const node = render(<div ref={undefined} />);

        assertInstanceOf(node, HTMLDivElement);

        dispose(node);
        assertInstanceOf(node, HTMLDivElement);
    });

    it("applies and updates style values across object, false, numeric and string forms", () => {
        const [ style, setStyle ] = createSignal<false | null | number | string | Record<string, null | number | string | undefined>>({
            color: "red",
            "font-size": null,
            display: "block"
        });
        const node = render(<div style={style} />);

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.style.getPropertyValue("color"), "red");
        assertSame(node.style.getPropertyValue("font-size"), "");
        assertSame(node.style.getPropertyValue("display"), "block");

        setStyle({ color: "blue" });
        assertSame(node.style.getPropertyValue("color"), "blue");
        assertSame(node.style.getPropertyValue("display"), "");

        setStyle(false);
        assertSame(node.hasAttribute("style"), false);

        setStyle(123);
        assertSame(node.getAttribute("style"), "123");

        setStyle("color: blue;");
        assertSame(node.getAttribute("style"), "color: blue;");

        dispose(node);
        setStyle("color: green;");
        assertSame(node.getAttribute("style"), "color: blue;");
    });

    it("applies boolean properties and removes them again", () => {
        const [ disabled, setDisabled ] = createSignal(true);
        const node = render(<button disabled={disabled} />);

        assertInstanceOf(node, HTMLButtonElement);
        assertSame(node.disabled, true);
        assertSame(node.hasAttribute("disabled"), true);

        setDisabled(false);

        assertSame(node.disabled, false);
        assertSame(node.hasAttribute("disabled"), false);
    });

    it("updates live input value and checked properties reactively", () => {
        const [ value, setValue ] = createSignal("initial");
        const [ checked, setChecked ] = createSignal(true);
        const node = render(<input value={value} checked={checked} />);

        assertInstanceOf(node, HTMLInputElement);
        assertSame(node.value, "initial");
        assertSame(node.hasAttribute("value"), false);
        assertSame(node.checked, true);
        assertSame(node.hasAttribute("checked"), true);

        node.value = "manual";
        node.checked = false;
        setValue("updated");
        setChecked(false);

        assertSame(node.value, "updated");
        assertSame(node.hasAttribute("value"), false);
        assertSame(node.checked, false);
        assertSame(node.hasAttribute("checked"), false);

        node.value = "manual again";
        node.checked = false;
        setValue("final");
        setChecked(true);

        assertSame(node.value, "final");
        assertSame(node.hasAttribute("value"), false);
        assertSame(node.checked, true);
        assertSame(node.hasAttribute("checked"), true);

        dispose(node);
        setValue("ignored");
        setChecked(false);

        assertSame(node.value, "final");
        assertSame(node.checked, true);
    });

    it("keeps boolean attributes when DOM boolean property writes fail", () => {
        const [ , setRef ] = createSignal<HTMLButtonElement | null>(null, {
            equals(previous, value) {
                void previous;
                if (value != null) {
                    Object.defineProperty(value, "disabled", {
                        configurable: true,
                        get() {
                            return false;
                        },
                        set() {
                            throw new Error("boom");
                        }
                    });
                }
                return false;
            }
        });
        const node = render(
            <button
                ref={setRef}
                disabled
            />
        );

        assertInstanceOf(node, HTMLButtonElement);
        assertSame(node.hasAttribute("disabled"), true);
    });

    it("falls back to attributes when DOM property writes fail", () => {
        const [ title, setTitle ] = createSignal<string | null>("Hello");
        const [ , setRef ] = createSignal<HTMLDivElement | null>(null, {
            equals(previous, value) {
                void previous;
                if (value != null) {
                    Object.defineProperty(value, "title", {
                        configurable: true,
                        get() {
                            return "";
                        },
                        set() {
                            throw new Error("boom");
                        }
                    });
                }
                return false;
            }
        });
        const node = render(
            <div
                ref={setRef}
                title={title}
            />
        );

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.getAttribute("title"), "Hello");

        setTitle(null);
        assertSame(node.hasAttribute("title"), false);
    });

    it("applies dashed names as plain attributes", () => {
        const node = render(<div data-count={5} />);

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.getAttribute("data-count"), "5");
    });

    it("treats boolean custom attributes as presence attributes", () => {
        const node = render(<div data-checked={true} />);

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.getAttribute("data-checked"), "");
    });

    it("serializes boolean ARIA values as strings and removes only nullish values", () => {
        const [ expanded, setExpanded ] = createSignal<boolean | null>(false);
        const node = render(<button aria-expanded={expanded} />);

        assertInstanceOf(node, HTMLButtonElement);
        assertSame(node.getAttribute("aria-expanded"), "false");

        setExpanded(true);
        assertSame(node.getAttribute("aria-expanded"), "true");

        setExpanded(null);
        assertSame(node.hasAttribute("aria-expanded"), false);
    });

    it("serializes boolean ARIA values on SVG elements as strings", () => {
        const node = render(<svg aria-hidden={true} aria-busy={false} />);

        assertInstanceOf(node, SVGSVGElement);
        assertSame(node.getAttribute("aria-hidden"), "true");
        assertSame(node.getAttribute("aria-busy"), "false");
    });

    it("switches non-fragment conditional branches and disposes the hidden tree", () => {
        const [ leftVisible, setLeftVisible ] = createSignal(true);
        const [ leftValue, setLeftValue ] = createSignal("L0");
        const [ rightValue, setRightValue ] = createSignal("R0");
        let leftRuns = 0;
        let rightRuns = 0;

        const node = render(
            <div>{() => leftVisible()
                ? <span>{() => {
                    leftRuns++;
                    return leftValue();
                }}</span>
                : <strong>{() => {
                    rightRuns++;
                    return rightValue();
                }}</strong>}</div>
        );

        assertSame(node.textContent, "L0");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 0);

        setLeftValue("L1");
        assertSame(node.textContent, "L1");
        assertSame(leftRuns, 2);

        setLeftVisible(false);
        assertSame(node.textContent, "R0");
        assertSame(leftRuns, 2);
        assertSame(rightRuns, 1);

        setLeftValue("L2");
        assertSame(node.textContent, "R0");
        assertSame(leftRuns, 2);

        setRightValue("R1");
        assertSame(node.textContent, "R1");
        assertSame(rightRuns, 2);
    });

    it("switches fragment conditional branches and disposes the hidden tree", () => {
        const [ leftVisible, setLeftVisible ] = createSignal(true);
        const [ leftValue, setLeftValue ] = createSignal("L0");
        const [ rightValue, setRightValue ] = createSignal("R0");
        let leftRuns = 0;
        let rightRuns = 0;

        const node = render(
            <div>{() => leftVisible()
                ? <>
                    <span>L:</span>
                    <strong>{() => {
                        leftRuns++;
                        return leftValue();
                    }}</strong>
                </>
                : <>
                    <span>R:</span>
                    <em>{() => {
                        rightRuns++;
                        return rightValue();
                    }}</em>
                </>}</div>
        );

        assertSame(node.textContent, "L:L0");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 0);

        setLeftVisible(false);
        assertSame(node.textContent, "R:R0");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 1);

        setLeftValue("L1");
        assertSame(node.textContent, "R:R0");
        assertSame(leftRuns, 1);

        setRightValue("R1");
        assertSame(node.textContent, "R:R1");
        assertSame(rightRuns, 2);
    });

    it("switches between a non-fragment branch and an empty branch", () => {
        const [ visible, setVisible ] = createSignal(true);
        const [ value, setValue ] = createSignal("V0");
        let runs = 0;

        const node = render(
            <div>{() => visible()
                ? <span>{() => {
                    runs++;
                    return value();
                }}</span>
                : null}</div>
        );

        assertSame(node.textContent, "V0");
        assertSame(runs, 1);

        setVisible(false);
        assertSame(node.textContent, "");
        assertSame(runs, 1);

        setValue("V1");
        assertSame(node.textContent, "");
        assertSame(runs, 1);

        setVisible(true);
        assertSame(node.textContent, "V1");
        assertSame(runs, 2);

        setValue("V2");
        assertSame(node.textContent, "V2");
        assertSame(runs, 3);
    });

    it("switches between a fragment branch and an empty branch", () => {
        const [ visible, setVisible ] = createSignal(true);
        const [ value, setValue ] = createSignal("V0");
        let runs = 0;

        const node = render(
            <div>{() => visible()
                ? <>
                    <span>value:</span>
                    <strong>{() => {
                        runs++;
                        return value();
                    }}</strong>
                </>
                : null}</div>
        );

        assertSame(node.textContent, "value:V0");
        assertSame(runs, 1);

        setVisible(false);
        assertSame(node.textContent, "");
        assertSame(runs, 1);

        setValue("V1");
        assertSame(node.textContent, "");
        assertSame(runs, 1);

        setVisible(true);
        assertSame(node.textContent, "value:V1");
        assertSame(runs, 2);

        setValue("V2");
        assertSame(node.textContent, "value:V2");
        assertSame(runs, 3);
    });

    it("switches nested getter branches and disposes the hidden getter subtree", () => {
        const [ leftVisible, setLeftVisible ] = createSignal(true);
        const [ leftValue, setLeftValue ] = createSignal("L0");
        const [ rightValue, setRightValue ] = createSignal("R0");
        let leftRuns = 0;
        let rightRuns = 0;

        const node = render(
            <div>{() => leftVisible()
                ? () => {
                    leftRuns++;
                    return leftValue();
                }
                : () => {
                    rightRuns++;
                    return rightValue();
                }}</div>
        );

        assertSame(node.textContent, "L0");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 0);

        setLeftVisible(false);
        assertSame(node.textContent, "R0");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 1);

        setLeftValue("L1");
        assertSame(node.textContent, "R0");
        assertSame(leftRuns, 1);

        setRightValue("R1");
        assertSame(node.textContent, "R1");
        assertSame(rightRuns, 2);
    });

    it("switches nested non-fragment conditional trees and disposes hidden subtrees", () => {
        const [ outerVisible, setOuterVisible ] = createSignal(true);
        const [ innerLeftVisible, setInnerLeftVisible ] = createSignal(true);
        const [ leftValue, setLeftValue ] = createSignal("L0");
        const [ rightValue, setRightValue ] = createSignal("R0");
        const [ fallbackValue, setFallbackValue ] = createSignal("F0");
        let leftRuns = 0;
        let rightRuns = 0;
        let fallbackRuns = 0;

        const node = render(
            <div>{() => outerVisible()
                ? <section>{() => innerLeftVisible()
                    ? <span>{() => {
                        leftRuns++;
                        return leftValue();
                    }}</span>
                    : <em>{() => {
                        rightRuns++;
                        return rightValue();
                    }}</em>}</section>
                : <p>{() => {
                    fallbackRuns++;
                    return fallbackValue();
                }}</p>}</div>
        );

        assertSame(node.textContent, "L0");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 0);
        assertSame(fallbackRuns, 0);

        setInnerLeftVisible(false);
        assertSame(node.textContent, "R0");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 1);

        setLeftValue("L1");
        assertSame(node.textContent, "R0");
        assertSame(leftRuns, 1);

        setOuterVisible(false);
        assertSame(node.textContent, "F0");
        assertSame(fallbackRuns, 1);

        setRightValue("R1");
        assertSame(node.textContent, "F0");
        assertSame(rightRuns, 1);

        setFallbackValue("F1");
        assertSame(node.textContent, "F1");
        assertSame(fallbackRuns, 2);
    });

    it("switches nested fragment conditional trees and disposes hidden subtrees", () => {
        const [ outerVisible, setOuterVisible ] = createSignal(true);
        const [ innerLeftVisible, setInnerLeftVisible ] = createSignal(true);
        const [ leftValue, setLeftValue ] = createSignal("L0");
        const [ rightValue, setRightValue ] = createSignal("R0");
        const [ fallbackValue, setFallbackValue ] = createSignal("F0");
        let leftRuns = 0;
        let rightRuns = 0;
        let fallbackRuns = 0;

        const node = render(
            <div>{() => outerVisible()
                ? <>
                    <span>outer:</span>
                    <section>{() => innerLeftVisible()
                        ? <>
                            <span>left:</span>
                            <strong>{() => {
                                leftRuns++;
                                return leftValue();
                            }}</strong>
                        </>
                        : <>
                            <span>right:</span>
                            <em>{() => {
                                rightRuns++;
                                return rightValue();
                            }}</em>
                        </>}</section>
                </>
                : <>
                    <span>fallback:</span>
                    <b>{() => {
                        fallbackRuns++;
                        return fallbackValue();
                    }}</b>
                </>}</div>
        );

        assertSame(node.textContent, "outer:left:L0");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 0);
        assertSame(fallbackRuns, 0);

        setInnerLeftVisible(false);
        assertSame(node.textContent, "outer:right:R0");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 1);

        setLeftValue("L1");
        assertSame(node.textContent, "outer:right:R0");
        assertSame(leftRuns, 1);

        setOuterVisible(false);
        assertSame(node.textContent, "fallback:F0");
        assertSame(fallbackRuns, 1);

        setRightValue("R1");
        assertSame(node.textContent, "fallback:F0");
        assertSame(rightRuns, 1);

        setFallbackValue("F1");
        assertSame(node.textContent, "fallback:F1");
        assertSame(fallbackRuns, 2);
    });

    it("removes event listeners when the rendered node is disposed", () => {
        let calls = 0;
        const node = render(<button on:click={() => {
            calls++;
        }} />);

        node.dispatchEvent(new Event("click"));
        assertSame(calls, 1);

        dispose(node);
        node.dispatchEvent(new Event("click"));
        assertSame(calls, 1);
    });

    it("throws cleanup errors from ref disposal", () => {
        const [ , setRef ] = createSignal<HTMLDivElement | null>(null, {
            equals(previous, value) {
                if (previous != null && value == null) {
                    throw new Error("ref cleanup boom");
                }
                return false;
            }
        });
        const node = render(<div ref={setRef} />);

        assertThrowWithMessage(() => dispose(node), Error, "ref cleanup boom");
    });

    it("aggregates multiple cleanup errors during disposal", () => {
        const [ , setRef ] = createSignal<HTMLButtonElement | null>(null, {
            equals(previous, value) {
                if (value == null) {
                    if (previous != null) {
                        throw new Error("ref cleanup boom");
                    }
                } else {
                    value.removeEventListener = () => {
                        throw new Error("listener cleanup boom");
                    };
                }
                return false;
            }
        });
        const node = render(
            <button
                ref={setRef}
                on:click={() => {
                    // Intentionally empty.
                }}
            />
        );

        let thrown: unknown = null;
        try {
            dispose(node);
        } catch (error) {
            thrown = error;
        }

        assertInstanceOf(thrown, AggregateError);
        assertSame(thrown.message, "Harmless cleanup failed");
        assertSame(thrown.errors.length, 2);
        assertSame(thrown.errors[0] instanceof Error ? thrown.errors[0].message : String(thrown.errors[0]), "ref cleanup boom");
        assertSame(thrown.errors[1] instanceof Error ? thrown.errors[1].message : String(thrown.errors[1]), "listener cleanup boom");
    });

    it("flattens aggregate errors from ref signal and event cleanup", () => {
        const [ , setRef ] = createSignal<HTMLButtonElement | null>(null, {
            equals(previous, value) {
                if (value == null) {
                    if (previous != null) {
                        throw new AggregateError([ new Error("ref-a"), new Error("ref-b") ], "ref cleanup aggregate");
                    }
                } else {
                    value.removeEventListener = () => {
                        throw new Error("listener cleanup boom");
                    };
                }
                return false;
            }
        });
        const node = render(
            <button
                ref={setRef}
                on:click={() => {
                    // Intentionally empty.
                }}
            />
        );

        let thrown: unknown = null;
        try {
            dispose(node);
        } catch (error) {
            thrown = error;
        }

        assertInstanceOf(thrown, AggregateError);
        assertSame(thrown.message, "Harmless cleanup failed");
        assertSame(thrown.errors.length, 3);
        assertSame(thrown.errors[0] instanceof Error ? thrown.errors[0].message : String(thrown.errors[0]), "ref-a");
        assertSame(thrown.errors[1] instanceof Error ? thrown.errors[1].message : String(thrown.errors[1]), "ref-b");
        assertSame(thrown.errors[2] instanceof Error ? thrown.errors[2].message : String(thrown.errors[2]), "listener cleanup boom");
    });

    it("throws when component rendering fails", () => {
        function Boom(): never {
            throw new Error("component boom");
        }

        assertThrowWithMessage(() => render(<Boom />), Error, "component boom");
    });

    it("throws on unsupported child values", () => {
        assertThrowWithMessage(() => render(Symbol("boom") as never), TypeError, "Unsupported Harmless child: Symbol(boom)");
    });
});
