/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import "../dom.ts";
import { describe, it } from "node:test";
import { assertInstanceOf, assertSame, assertThrowWithMessage } from "@kayahr/assert";
import { SignalError, createMemo, createSignal } from "@kayahr/signal";
import { For } from "../../main/components/For.ts";
import { If } from "../../main/components/If.ts";
import { render } from "../../main/render.ts";

describe("If", () => {
    it("renders children when the static condition is true", () => {
        const node = render(
            <If test={true} else={<span>no</span>}>
                <span>yes</span>
            </If>
        );

        assertInstanceOf(node, HTMLSpanElement);
        assertSame(node.textContent, "yes");
    });

    it("renders else when the static condition is false", () => {
        const node = render(
            <If test={false} else={<span>no</span>}>
                <span>yes</span>
            </If>
        );

        assertInstanceOf(node, HTMLSpanElement);
        assertSame(node.textContent, "no");
    });

    it("renders nothing when the static condition is falsy and else is omitted", () => {
        const node = render(
            <If test={false}>
                <span>yes</span>
            </If>
        );

        assertInstanceOf(node, DocumentFragment);
        assertSame(node.childNodes.length, 2);
        assertSame(node.textContent, "");
    });

    it("switches reactive branches and disposes the hidden branch", () => {
        const [ visible, setVisible ] = createSignal(true);
        const [ leftValue, setLeftValue ] = createSignal("L0");
        const [ rightValue, setRightValue ] = createSignal("R0");
        let leftRuns = 0;
        let rightRuns = 0;

        const node = render(
            <div>
                <If test={visible} else={
                    <>
                        <span>R:</span>
                        <em>{() => {
                            rightRuns++;
                            return rightValue();
                        }}</em>
                    </>
                }>
                    <>
                        <span>L:</span>
                        <strong>{() => {
                            leftRuns++;
                            return leftValue();
                        }}</strong>
                    </>
                </If>
            </div>
        );

        assertSame(node.textContent, "L:L0");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 0);

        setVisible(false);
        assertSame(node.textContent, "R:R0");
        assertSame(leftRuns, 1);
        assertSame(rightRuns, 1);

        setLeftValue("L1");
        assertSame(node.textContent, "R:R0");
        assertSame(leftRuns, 1);

        setRightValue("R1");
        assertSame(node.textContent, "R:R1");
        assertSame(rightRuns, 2);

        setVisible(true);
        assertSame(node.textContent, "L:L1");
        assertSame(leftRuns, 2);
        assertSame(rightRuns, 2);
    });

    it("disposes and remounts a nested For list when toggled", () => {
        const [ visible, setVisible ] = createSignal(true);
        const [ items, setItems ] = createSignal([ "A", "B" ]);
        let instances = 0;
        let removedMemo: (() => string) | undefined;

        function Row(props: { item: () => string; index: () => number }) {
            const instanceId = ++instances;
            const memo = createMemo(() => `${props.item()}:${props.index()}:#${instanceId}`);
            if (props.item() === "A") {
                removedMemo = memo;
            }
            return <div>{memo}</div>;
        }

        const node = render(
            <div>
                <If test={visible}>
                    <For of={items}>
                        {(item: () => string, index: () => number) => <Row item={item} index={index} />}
                    </For>
                </If>
            </div>
        );

        assertSame(node.textContent, "A:0:#1B:1:#2");
        assertSame(instances, 2);

        setVisible(false);
        assertSame(node.textContent, "");

        if (removedMemo == null) {
            throw new Error("Expected removed row memo to be assigned");
        }
        const disposedMemo = removedMemo;
        assertThrowWithMessage(() => disposedMemo(), SignalError, "Cannot read a disposed memo");

        setItems([ "C" ]);
        assertSame(node.textContent, "");

        setVisible(true);
        assertSame(node.textContent, "C:0:#3");
        assertSame(instances, 3);
    });
});
