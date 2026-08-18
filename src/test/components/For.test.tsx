/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import "../dom.ts";
import { describe, it } from "node:test";
import { assertInstanceOf, assertSame, assertThrowWithMessage } from "@kayahr/assert";
import { dispose } from "@kayahr/scope";
import { SignalError, createEffect, createMemo, createSignal } from "@kayahr/signal";
import { For } from "../../main/components/For.ts";
import { If } from "../../main/components/If.ts";
import { Rendered } from "../../main/rendered/Rendered.ts";
import { RenderedBase } from "../../main/rendered/RenderedBase.ts";
import { NodeRendered } from "../../main/rendered/NodeRendered.ts";
import { render } from "../../main/render.ts";

describe("For", () => {
    it("renders static arrays", () => {
        const node = render(
            <div>
                <For of={[ 1, 2, 3 ]}>
                    {(item: () => number) => <span>{item}</span>}
                </For>
            </div>
        );

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.textContent, "123");
    });

    it("keeps the For range anchors when used as an element child", () => {
        const node = render(
            <div>
                <For of={[ "A" ]}>
                    {(item: () => string) => <span>{item}</span>}
                </For>
            </div>
        );

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.childNodes.length, 3);
        assertInstanceOf(node.childNodes[0], Comment);
        assertInstanceOf(node.childNodes[1], HTMLSpanElement);
        assertInstanceOf(node.childNodes[2], Comment);
        assertSame(node.textContent, "A");
    });

    it("renders and updates For inside an outer fragment", () => {
        const [ items, setItems ] = createSignal([ "A", "B" ]);
        const host = document.createElement("div");
        const fragment = render(
            <>
                <span>before:</span>
                <For of={items}>
                    {(item: () => string) => <strong>{item}</strong>}
                </For>
                <span>:after</span>
            </>
        );

        assertInstanceOf(fragment, DocumentFragment);

        host.appendChild(fragment);
        assertSame(host.textContent, "before:AB:after");

        setItems([ "B", "C" ]);
        assertSame(host.textContent, "before:BC:after");

        dispose(fragment);
        setItems([ "X" ]);
        assertSame(host.textContent, "before:BC:after");
    });

    it("uses the actual svg parent namespace for a directly created For view", () => {
        const list = For({
            of: [ 1, 2 ],
            children: (item: () => number) => <circle cx="5" cy="5" r={item} />
        });

        const node = render(
            <svg viewBox="0 0 10 10">
                {list}
            </svg>
        );

        assertInstanceOf(node, Element);
        const circles = Array.from(node.children);
        assertSame(circles.length, 2);
        assertSame(circles[0].namespaceURI, "http://www.w3.org/2000/svg");
        assertSame(circles[1].namespaceURI, "http://www.w3.org/2000/svg");
    });

    it("uses the html namespace for a directly created For view inside foreignObject", () => {
        const list = For({
            of: [ "A" ],
            children: (item: () => string) => <div>{item}</div>
        });

        const node = render(
            <svg viewBox="0 0 10 10">
                <foreignObject x="0" y="0" width="10" height="10">
                    {list}
                </foreignObject>
            </svg>
        );

        assertInstanceOf(node, Element);
        const foreignObject = node.firstElementChild;
        if (foreignObject == null) {
            throw new Error("Expected foreignObject");
        }
        const div = foreignObject.firstElementChild;
        if (div == null) {
            throw new Error("Expected html child");
        }
        assertSame(div.namespaceURI, "http://www.w3.org/1999/xhtml");
    });

    it("rebuilds cached direct For views when reinserted under a different namespace", () => {
        const rendered = For({
            of: [ 1 ],
            children: () => <circle cx="5" cy="5" r="1" />
        });
        if (!(rendered instanceof RenderedBase)) {
            throw new Error("Expected For to return an internal RenderedBase");
        }

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        rendered.insert(svg, null);

        const svgCircle = svg.firstElementChild;
        if (svgCircle == null) {
            throw new Error("Expected svg circle");
        }
        assertSame(svgCircle.namespaceURI, "http://www.w3.org/2000/svg");

        rendered.destroy();

        const div = document.createElement("div");
        rendered.insert(div, null);

        const htmlCircle = div.firstElementChild;
        if (htmlCircle == null) {
            throw new Error("Expected html circle");
        }
        assertSame(htmlCircle.namespaceURI, "http://www.w3.org/1999/xhtml");
    });

    it("renders fragment row outputs", () => {
        const [ items, setItems ] = createSignal([ "A", "B" ]);

        const node = render(
            <div>
                <For of={items}>
                    {(item: () => string) => <>
                        <span>[</span>
                        <strong>{item}</strong>
                        <span>]</span>
                    </>}
                </For>
            </div>
        );

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.textContent, "[A][B]");

        setItems([ "B", "C" ]);

        assertSame(node.textContent, "[B][C]");
    });

    it("renders nullish sources as empty", () => {
        const node = render(
            <div>
                <For of={null}>
                    {(item: () => never) => item}
                </For>
            </div>
        );

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.textContent, "");
    });

    it("reuses rows by item identity when key is omitted", () => {
        const first = { label: "A" };
        const second = { label: "B" };
        const [ items, setItems ] = createSignal([ first, second ]);
        let instances = 0;

        function Row(props: { item: () => { label: string }; index: () => number }) {
            const instanceId = ++instances;
            return <div>{() => `${props.item().label}:${props.index()}:#${instanceId}`}</div>;
        }

        const node = render(
            <div>
                <For of={items}>
                    {(item: () => { label: string }, index: () => number) => <Row item={item} index={index} />}
                </For>
            </div>
        );

        assertSame(node.textContent, "A:0:#1B:1:#2");
        assertSame(instances, 2);

        setItems([ second, first ]);

        assertSame(node.textContent, "B:0:#2A:1:#1");
        assertSame(instances, 2);
    });

    it("reuses rows by extracted key and updates the row item signal", () => {
        const [ items, setItems ] = createSignal([ { id: 1, label: "A" } ]);
        let instances = 0;

        function Row(props: { item: () => { id: number; label: string } }) {
            const instanceId = ++instances;
            return <div>{() => `${props.item().label}:#${instanceId}`}</div>;
        }

        const node = render(
            <div>
                <For of={items} key={(item: { id: number; label: string }) => item.id}>
                    {(item: () => { id: number; label: string }) => <Row item={item} />}
                </For>
            </div>
        );

        assertSame(node.textContent, "A:#1");
        assertSame(instances, 1);

        setItems([ { id: 1, label: "AA" } ]);

        assertSame(node.textContent, "AA:#1");
        assertSame(instances, 1);
    });

    it("disposes rows removed from a keyed list", () => {
        const [ items, setItems ] = createSignal([
            { id: 1, label: "A" },
            { id: 2, label: "B" }
        ]);
        let removedMemo: (() => string) | undefined;

        function Row(props: { item: () => { id: number; label: string } }) {
            const memo = createMemo(() => props.item().label);
            if (props.item().id === 1) {
                removedMemo = memo;
            }
            return <div>{memo}</div>;
        }

        const node = render(
            <div>
                <For of={items} key={(item: { id: number; label: string }) => item.id}>
                    {(item: () => { id: number; label: string }) => <Row item={item} />}
                </For>
            </div>
        );

        assertSame(node.textContent, "AB");

        setItems([ { id: 2, label: "B" } ]);

        assertSame(node.textContent, "B");
        if (removedMemo == null) {
            throw new Error("Expected removed row memo to be assigned");
        }
        const disposedMemo = removedMemo;
        assertThrowWithMessage(() => disposedMemo(), SignalError, "Cannot read a disposed memo");
    });

    it("keeps slot identity when key is set to index", () => {
        const [ items, setItems ] = createSignal([ "A", "B" ]);
        let instances = 0;

        function Row(props: { item: () => string }) {
            const instanceId = ++instances;
            return <div>{() => `${props.item()}:#${instanceId}`}</div>;
        }

        const node = render(
            <div>
                <For of={items} key="index">
                    {(item: () => string) => <Row item={item} />}
                </For>
            </div>
        );

        assertSame(node.textContent, "A:#1B:#2");
        assertSame(instances, 2);

        setItems([ "B", "A" ]);

        assertSame(node.textContent, "B:#1A:#2");
        assertSame(instances, 2);
    });

    it("destroys trailing rows when key is set to index and the list shrinks", () => {
        const [ items, setItems ] = createSignal([ "A", "B", "C" ]);
        let destroyed = 0;

        function Row(props: { item: () => string }) {
            createEffect(({ onCleanup }) => {
                props.item();
                onCleanup(() => {
                    destroyed++;
                });
            });
            return <span>{props.item}</span>;
        }

        const node = render(
            <div>
                <For of={items} key="index">
                    {(item: () => string) => <Row item={item} />}
                </For>
            </div>
        );

        assertSame(node.textContent, "ABC");

        setItems([ "A" ]);

        assertSame(node.textContent, "A");
        assertSame(destroyed, 2);
    });

    it("switches fragment If branches inside reused rows", () => {
        type RowItem = { id: number; side: "left" | "right"; left: string; right: string };
        const [ items, setItems ] = createSignal<RowItem[]>([
            { id: 1, side: "left" as const, left: "A0", right: "B0" }
        ]);
        let leftRuns = 0;
        let rightRuns = 0;

        const node = render(
            <div>
                <For of={items} key={(item: RowItem) => item.id}>
                    {(item: () => RowItem) => (
                        <If test={() => item().side === "left"} else={
                            <>
                                <span>R:</span>
                                <em>{() => {
                                    rightRuns++;
                                    return item().right;
                                }}</em>
                            </>
                        }>
                            <>
                                <span>L:</span>
                                <strong>{() => {
                                    leftRuns++;
                                    return item().left;
                                }}</strong>
                            </>
                        </If>
                    )}
                </For>
            </div>
        );

        assertSame(node.textContent, "L:A0");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 0);

        setItems([ { id: 1, side: "right", left: "A1", right: "B1" } ]);

        assertSame(node.textContent, "R:B1");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 1);

        setItems([ { id: 1, side: "right", left: "A2", right: "B2" } ]);

        assertSame(node.textContent, "R:B2");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 2);

        setItems([ { id: 1, side: "left", left: "A3", right: "B3" } ]);

        assertSame(node.textContent, "L:A3");
        assertSame(leftRuns, 2);
        assertSame(rightRuns, 2);
    });

    it("returns a managed range view when called directly", () => {
        const rendered = For<number>({
            of: [ 1 ],
            children: (item: () => number) => item
        });
        const nothing: unknown = null;
        const plainObject: unknown = {};
        const text: unknown = "nope";

        if (!(rendered instanceof Rendered)) {
            throw new Error("Expected For to return a Rendered internally");
        }

        assertSame(nothing instanceof Rendered, false);
        assertSame(plainObject instanceof Rendered, false);
        assertSame(text instanceof Rendered, false);
        if (!(rendered instanceof RenderedBase)) {
            throw new Error("Expected For to return an internal RenderedBase");
        }
        assertSame(rendered.getSingleNode(), null);
    });

    it("stops list updates when row cleanup throws during disposal", () => {
        const [ items, setItems ] = createSignal([ 1 ]);
        let rowRuns = 0;
        const rendered = For({
            of: items,
            children: (item: () => number) => {
                rowRuns++;
                return new NodeRendered(document.createTextNode(String(item())), () => {
                    throw new Error("row cleanup");
                });
            }
        });

        if (!(rendered instanceof RenderedBase)) {
            throw new Error("Expected For to return an internal RenderedBase");
        }

        const host = document.createElement("div");
        rendered.insert(host, null);

        assertSame(rowRuns, 1);
        assertThrowWithMessage(() => rendered.dispose(), Error, "row cleanup");

        setItems([ 2 ]);
        assertSame(rowRuns, 1);
    });

    it("does not reinsert unchanged keyed rows", () => {
        const first = { label: "A" };
        const second = { label: "B" };
        const [ items, setItems ] = createSignal([ first, second ]);
        const rendered = For({
            of: items,
            children: item => <span>{() => item().label}</span>
        });
        if (!(rendered instanceof RenderedBase)) {
            throw new Error("Expected For to return an internal RenderedBase");
        }

        const host = document.createElement("div");
        rendered.insert(host, null);
        assertSame(host.textContent, "AB");

        let insertCalls = 0;
        const insertBefore = host.insertBefore.bind(host);
        host.insertBefore = ((...args: Parameters<typeof host.insertBefore>) => {
            insertCalls++;
            return insertBefore(...args);
        }) as typeof host.insertBefore;

        insertCalls = 0;
        setItems([ first, second ]);
        assertSame(host.textContent, "AB");
        assertSame(insertCalls, 0);

        insertCalls = 0;
        setItems([ second, first ]);
        assertSame(host.textContent, "BA");
        assertSame(insertCalls, 1);
    });

    it("does not move surviving keyed rows when only stale rows are removed", () => {
        const first = { label: "A" };
        const second = { label: "B" };
        const third = { label: "C" };
        const [ items, setItems ] = createSignal([ first, second, third ]);
        const rendered = For({
            of: items,
            children: item => <span>{() => item().label}</span>
        });
        if (!(rendered instanceof RenderedBase)) {
            throw new Error("Expected For to return an internal RenderedBase");
        }
        const host = document.createElement("div");
        rendered.insert(host, null);
        assertSame(host.textContent, "ABC");

        let insertCalls = 0;
        const insertBefore = host.insertBefore.bind(host);
        host.insertBefore = ((...args: Parameters<typeof host.insertBefore>) => {
            insertCalls++;
            return insertBefore(...args);
        }) as typeof host.insertBefore;

        setItems([ first, third ]);
        assertSame(host.textContent, "AC");
        assertSame(insertCalls, 0);
    });

    it("keeps nested empty fragment lists stable across keyed updates", () => {
        const row = { id: 1 };
        const [ rows, setRows ] = createSignal([ row ]);

        const node = render(
            <div>
                <For of={rows}>
                    {() => (
                        <For of={[ "inner" ]}>
                            {() => [ null ]}
                        </For>
                    )}
                </For>
            </div>
        );

        assertSame(node.textContent, "");

        setRows([ row ]);

        assertSame(node.textContent, "");
    });

    it("keeps empty fragment rows stable across keyed updates", () => {
        const row = { id: 1 };
        const [ rows, setRows ] = createSignal([ row ]);

        const node = render(
            <div>
                <For of={rows}>
                    {() => [ null ]}
                </For>
            </div>
        );

        assertSame(node.textContent, "");

        setRows([ row ]);

        assertSame(node.textContent, "");
    });

    it("keeps empty getter rows stable across keyed updates", () => {
        const row = { id: 1 };
        const [ rows, setRows ] = createSignal([ row ]);
        const [ visible, setVisible ] = createSignal(false);

        const node = render(
            <div>
                <For of={rows}>
                    {() => () => visible() ? "visible" : null}
                </For>
            </div>
        );

        assertSame(node.textContent, "");

        setRows([ row ]);
        assertSame(node.textContent, "");

        setVisible(true);
        assertSame(node.textContent, "visible");
    });

    it("uses the latest state on first insert and inserts before siblings", () => {
        const [ items, setItems ] = createSignal([ "A", "B" ]);
        let disposedRows = 0;

        function Row(props: { item: () => string; index: () => number }) {
            createEffect(({ onCleanup }) => {
                onCleanup(() => {
                    disposedRows++;
                });
            });
            return <>{() => `${props.item()}:${props.index()}`}</>;
        }

        const rendered = For<string>({
            of: items,
            key: "index",
            children: (item, index) => <Row item={item} index={index} />
        });
        if (!(rendered instanceof RenderedBase)) {
            throw new Error("Expected For to return an internal RenderedBase");
        }

        assertSame(rendered.getSingleNode(), null);
        setItems([ "A" ]);
        assertSame(disposedRows, 0);

        const host = document.createElement("div");
        const tail = document.createElement("span");
        tail.textContent = "tail";
        host.appendChild(tail);

        rendered.insert(host, tail);
        assertSame(host.textContent, "A:0tail");

        setItems([ "A", "B", "C" ]);
        assertSame(host.textContent, "A:0B:1C:2tail");

        rendered.dispose();
        rendered.dispose();
        assertSame(disposedRows, 3);
    });

    it("can reuse one cached for view across reactive branch toggles", () => {
        const [ visible, setVisible ] = createSignal(true);
        const list = For({
            of: [ "A" ],
            children: item => <span>{item()}</span>
        });

        const node = render(() => visible() ? list : null);
        document.body.append(node);

        assertSame(document.body.textContent, "A");

        setVisible(false);
        assertSame(document.body.textContent, "");

        setVisible(true);
        assertSame(document.body.textContent, "A");
    });

    it("destroys the whole list view idempotently", () => {
        const [ items, setItems ] = createSignal([ "A", "B" ]);
        let destroyedCount = 0;

        function Row(props: { item: () => string }) {
            createEffect(({ onCleanup }) => {
                onCleanup(() => {
                    destroyedCount++;
                });
            });
            return <>{props.item}</>;
        }

        const rendered = For<string>({
            of: items,
            children: item => <Row item={item} />
        });
        if (!(rendered instanceof RenderedBase)) {
            throw new Error("Expected For to return an internal RenderedBase");
        }

        assertSame(rendered.getSingleNode(), null);
        const host = document.createElement("div");
        rendered.insert(host, null);
        assertSame(host.textContent, "AB");

        setItems([ "B", "C", "A" ]);
        assertSame(host.textContent, "BCA");

        rendered.destroy();
        rendered.destroy();

        assertSame(host.textContent, "");
        assertSame(destroyedCount, 3);
    });

    it("handles duplicate keys deterministically", () => {
        const [ items, setItems ] = createSignal([ "A", "A" ]);
        const rendered = For<string>({
            of: items,
            children: item => item
        });
        if (!(rendered instanceof RenderedBase)) {
            throw new Error("Expected For to return an internal RenderedBase");
        }

        const host = document.createElement("div");
        rendered.insert(host, null);
        assertSame(host.textContent, "AA");

        setItems([ "A" ]);
        assertSame(host.textContent, "A");
    });
});
