/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Context } from "@kayahr/cdi";
import { signal } from "@kayahr/signal";
import { describe, it } from "node:test";
import { assertGreaterThan, assertSame } from "@kayahr/assert";
import { Choose, Otherwise, When } from "../../main/components/Choose.ts";
import { component } from "../../main/utils/component.ts";
import { onDestroy } from "../../main/utils/lifecycle.ts";
import { render } from "../../main/utils/render.ts";
import { sleep } from "../support.ts";

describe("Choose", () => {
    it("renders empty node if empty", () => {
        const choose = <Choose></Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        assertSame(root.innerHTML, "<!--<>--><!--</>-->");
    });
    it("renders first <When> node that matches test expression", () => {
        const choose = <Choose>
            <When test={() => Math.random() > 1}>A</When>
            <When test={() => 2 > 1}>B</When>
            <When test={() => 3 > 1}>C</When>
            <Otherwise>X</Otherwise>
        </Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        assertSame(root.innerHTML, "<!--<>-->B<!--</>-->");
    });
    it("renders first <Otherwise> node when no <When> node matches test expression", () => {
        const choose = <Choose>
            <When test={() => 2 < 1}>B</When>
            <When test={() => 3 < 1}>C</When>
            <Otherwise>X</Otherwise>
            <Otherwise>Y</Otherwise>
        </Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        assertSame(root.innerHTML, "<!--<>-->X<!--</>-->");
    });
    it("renders <Otherwise> node when only child", () => {
        const choose = <Choose>
            <Otherwise>X</Otherwise>
        </Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        assertSame(root.innerHTML, "<!--<>-->X<!--</>-->");
    });
    it("dynamically switches content", () => {
        const value = signal(0);
        const choose = <Choose>
            <When test={() => value.get() < 1}>A</When>
            <When test={() => value.get() < 2}>B</When>
            <When test={() => value.get() < 3}>C</When>
            <Otherwise>X</Otherwise>
        </Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        assertSame(root.innerHTML, "<!--<>-->A<!--</>-->");
        value.set(1);
        assertSame(root.innerHTML, "<!--<>-->B<!--</>-->");
        value.set(2);
        assertSame(root.innerHTML, "<!--<>-->C<!--</>-->");
        value.set(3);
        assertSame(root.innerHTML, "<!--<>-->X<!--</>-->");
    });
    it("initializes shown components and destroys hidden components", (context) => {
        const value = signal(0);
        const initA = context.mock.fn();
        const destroyA = context.mock.fn();
        const initX = context.mock.fn();
        const destroyX = context.mock.fn();
        function A() {
            initA();
            onDestroy(destroyA);
            return "A";
        }
        function X() {
            initX();
            onDestroy(destroyX);
            return "X";
        }
        const choose = <Choose>
            <When test={() => value.get() < 1}><A /></When>
            <Otherwise><X /></Otherwise>
        </Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        assertSame(initA.mock.callCount(), 1);
        assertSame(initX.mock.callCount(), 0);
        assertSame(destroyA.mock.callCount(), 0);
        assertSame(destroyX.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->A<!--</>-->");
        initA.mock.resetCalls();

        value.set(1);
        assertSame(initA.mock.callCount(), 0);
        assertSame(initX.mock.callCount(), 1);
        assertSame(destroyA.mock.callCount(), 1);
        assertSame(destroyX.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->X<!--</>-->");
        initX.mock.resetCalls();
        destroyA.mock.resetCalls();

        value.set(0);
        assertGreaterThan(initA.mock.callCount(), 0);
        assertSame(initX.mock.callCount(), 0);
        assertSame(destroyA.mock.callCount(), 0);
        assertSame(destroyX.mock.callCount(), 1);
        assertSame(root.innerHTML, "<!--<>-->A<!--</>-->");
        initA.mock.resetCalls();
        destroyX.mock.resetCalls();

        value.set(1);
        assertSame(initA.mock.callCount(), 0);
        assertSame(initX.mock.callCount(), 1);
        assertSame(destroyA.mock.callCount(), 1);
        assertSame(destroyX.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->X<!--</>-->");
    });

    it("initializes shown async components and destroys hidden async components", async (context) => {
        const value = signal(0);
        const initA = context.mock.fn();
        const destroyA = context.mock.fn();
        const initX = context.mock.fn();
        const destroyX = context.mock.fn();
        class DepA {
            public static create(): Promise<DepA> {
                return Promise.resolve(new DepA());
            }
        }
        Context.getActive().setFactory(DepA, DepA.create);
        class DepX {
            public static create(): Promise<DepX> {
                return Promise.resolve(new DepX());
            }
        }
        Context.getActive().setFactory(DepX, DepX.create);
        function A(props: {}, depA: DepA) {
            initA();
            onDestroy(destroyA);
            return "A";
        }
        component(A, { inject: [ DepA ] });
        function X(props: {}, depX: DepX) {
            initX();
            onDestroy(destroyX);
            return "X";
        }
        component(X, { inject: [ DepX ] });
        const choose = <Choose>
            <When test={() => value.get() < 1}><A /></When>
            <Otherwise><X /></Otherwise>
        </Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        await sleep(0);
        assertSame(initA.mock.callCount(), 1);
        assertSame(initX.mock.callCount(), 0);
        assertSame(destroyA.mock.callCount(), 0);
        assertSame(destroyX.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->A<!--</>-->");
        initA.mock.resetCalls();

        value.set(1);
        await sleep(0);
        assertSame(initA.mock.callCount(), 0);
        assertSame(initX.mock.callCount(), 1);
        assertSame(destroyA.mock.callCount(), 1);
        assertSame(destroyX.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->X<!--</>-->");
        initX.mock.resetCalls();
        destroyA.mock.resetCalls();

        value.set(0);
        await sleep(0);
        assertGreaterThan(initA.mock.callCount(), 0);
        assertSame(initX.mock.callCount(), 0);
        assertSame(destroyA.mock.callCount(), 0);
        assertSame(destroyX.mock.callCount(), 1);
        assertSame(root.innerHTML, "<!--<>-->A<!--</>-->");
        initA.mock.resetCalls();
        destroyX.mock.resetCalls();

        value.set(1);
        await sleep(0);
        assertSame(initA.mock.callCount(), 0);
        assertSame(initX.mock.callCount(), 1);
        assertSame(destroyA.mock.callCount(), 1);
        assertSame(destroyX.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->X<!--</>-->");
    });
});
