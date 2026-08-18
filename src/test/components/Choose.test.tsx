/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import "../dom.ts";
import { dispose } from "@kayahr/scope";
import { createSignal } from "@kayahr/signal";
import { describe, it } from "node:test";
import { assertInstanceOf, assertSame } from "@kayahr/assert";
import { Choose, Otherwise, When } from "../../main/components/Choose.ts";
import type { ComponentContext, NoProps } from "../../main/jsx.ts";
import { render } from "../../main/render.ts";

describe("Choose", () => {
    it("renders the first static When branch whose test is true", () => {
        const node = render(
            <Choose>
                ignored text
                <span>ignored element</span>
                <When test={false}><span>A</span></When>
                <When test={true}><span>B</span></When>
                <When test={true}><span>C</span></When>
                <Otherwise><span>X</span></Otherwise>
            </Choose>
        );

        assertInstanceOf(node, HTMLSpanElement);
        assertSame(node.textContent, "B");
    });

    it("renders an empty matching When branch instead of Otherwise", () => {
        const node = render(
            <Choose>
                <When test={true} />
                <Otherwise>X</Otherwise>
            </Choose>
        );

        assertInstanceOf(node, DocumentFragment);
        assertSame(node.textContent, "");
    });

    it("renders the first Otherwise branch when no test matches", () => {
        const node = render(
            <Choose>
                <When test={false}>A</When>
                <Otherwise><span>X</span></Otherwise>
                <Otherwise><span>Y</span></Otherwise>
            </Choose>
        );

        assertInstanceOf(node, HTMLSpanElement);
        assertSame(node.textContent, "X");
    });

    it("renders the Otherwise branch when it is the only child", () => {
        const node = render(
            <Choose>
                <Otherwise><span>X</span></Otherwise>
            </Choose>
        );

        assertInstanceOf(node, HTMLSpanElement);
        assertSame(node.textContent, "X");
    });

    it("renders an empty branch when Otherwise has no children", () => {
        const node = render(
            <Choose>
                <Otherwise />
            </Choose>
        );

        assertInstanceOf(node, DocumentFragment);
        assertSame(node.textContent, "");
    });

    it("renders an empty branch when Choose has no children", () => {
        const node = render(<Choose />);

        assertInstanceOf(node, DocumentFragment);
        assertSame(node.textContent, "");
    });

    it("renders an empty branch when no test matches and Otherwise is omitted", () => {
        const node = render(
            <Choose>
                <When test={false}>A</When>
            </Choose>
        );

        assertInstanceOf(node, DocumentFragment);
        assertSame(node.textContent, "");
    });

    it("switches reactively between the first matching branch and Otherwise", () => {
        const [ value, setValue ] = createSignal(0);
        const node = render(
            <div>
                <Choose>
                    <When test={() => value() < 1}>A</When>
                    <When test={() => value() < 2}>B</When>
                    <When test={() => value() < 3}>C</When>
                    <Otherwise>X</Otherwise>
                </Choose>
            </div>
        );

        assertSame(node.textContent, "A");
        setValue(1);
        assertSame(node.textContent, "B");
        setValue(2);
        assertSame(node.textContent, "C");
        setValue(3);
        assertSame(node.textContent, "X");
        setValue(0);
        assertSame(node.textContent, "A");
    });

    it("stops testing after the first matching branch", () => {
        const [ first, setFirst ] = createSignal(true);
        const [ second, setSecond ] = createSignal(true);
        let secondRuns = 0;
        const node = render(
            <div>
                <Choose>
                    <When test={first}>A</When>
                    <When test={() => {
                        secondRuns++;
                        return second();
                    }}>B</When>
                    <Otherwise>X</Otherwise>
                </Choose>
            </div>
        );

        assertSame(node.textContent, "A");
        assertSame(secondRuns, 0);

        setSecond(false);
        assertSame(node.textContent, "A");
        assertSame(secondRuns, 0);

        setFirst(false);
        assertSame(node.textContent, "X");
        assertSame(secondRuns, 1);

        setSecond(true);
        assertSame(node.textContent, "B");
        assertSame(secondRuns, 2);
    });

    it("materializes only the selected branch and disposes it when the selection changes", () => {
        const [ showA, setShowA ] = createSignal(true);
        let createdA = 0;
        let disposedA = 0;
        let createdX = 0;
        let disposedX = 0;

        function A(props: NoProps, context: ComponentContext) {
            createdA++;
            context.onDispose(() => {
                disposedA++;
            });
            return <span>A</span>;
        }

        function X(props: NoProps, context: ComponentContext) {
            createdX++;
            context.onDispose(() => {
                disposedX++;
            });
            return <span>X</span>;
        }

        const node = render(
            <div>
                <Choose>
                    <When test={showA}><A /></When>
                    <Otherwise><X /></Otherwise>
                </Choose>
            </div>
        );

        assertSame(node.textContent, "A");
        assertSame(createdA, 1);
        assertSame(disposedA, 0);
        assertSame(createdX, 0);
        assertSame(disposedX, 0);

        setShowA(false);
        assertSame(node.textContent, "X");
        assertSame(createdA, 1);
        assertSame(disposedA, 1);
        assertSame(createdX, 1);
        assertSame(disposedX, 0);

        setShowA(true);
        assertSame(node.textContent, "A");
        assertSame(createdA, 2);
        assertSame(disposedA, 1);
        assertSame(createdX, 1);
        assertSame(disposedX, 1);

        dispose(node);
        assertSame(disposedA, 2);
        assertSame(disposedX, 1);
    });

    it("returns branch children when marker components are called directly", () => {
        assertSame(When({ test: true, children: "A" }), "A");
        assertSame(When({ test: false }), null);
        assertSame(Otherwise({ children: "X" }), "X");
        assertSame(Otherwise({}), null);
    });
});
