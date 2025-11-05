/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Context } from "@kayahr/cdi";
import { signal } from "@kayahr/signal";
import { describe, it } from "node:test";

import { If } from "../../main/components/If.ts";
import { component } from "../../main/utils/component.ts";
import { onDestroy } from "../../main/utils/lifecycle.ts";
import { render } from "../../main/utils/render.ts";
import { sleep } from "../support.ts";
import { assertGreaterThan, assertSame } from "@kayahr/assert";

describe("If", () => {
    it("renders nothing if empty", () => {
        const condition = <If test={() => true}></If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        assertSame(root.innerHTML, "<!--<>--><!--</>-->");
    });
    it("renders children when test expression returns true", () => {
        const condition = <If test={() => true}>{1}A</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        assertSame(root.innerHTML, "<!--<>--><!--<>-->1A<!--</>--><!--</>-->");
    });
    it("does not render children when test expression returns false", () => {
        const condition = <If test={() => false}>{1}A</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        assertSame(root.innerHTML, "<!--<>--><!--</>-->");
    });
    it("renders the `then` parameter when test expression returns true", () => {
        const condition = <If test={() => true} then={1}></If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        assertSame(root.innerHTML, "<!--<>-->1<!--</>-->");
    });
    it("renders the `then` parameter when test expression returns true and there is an else parameter", () => {
        const condition = <If test={() => true} then={1} else={2}></If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        assertSame(root.innerHTML, "<!--<>-->1<!--</>-->");
    });
    it("renders the `then` parameter when test expression returns true and ignores children", () => {
        const condition = <If test={() => true} then={1}>3</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        assertSame(root.innerHTML, "<!--<>-->1<!--</>-->");
    });
    it("renders the `else` parameter when test expression returns false", () => {
        const condition = <If test={() => false} then={1} else={2}>3</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        assertSame(root.innerHTML, "<!--<>-->2<!--</>-->");
    });
    it("dynamically switches content", () => {
        const value = signal(0);
        const condition = <If test={() => value.get() === 1} else="fallback">children</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        assertSame(root.innerHTML, "<!--<>-->fallback<!--</>-->");
        value.set(1);
        assertSame(root.innerHTML, "<!--<>-->children<!--</>-->");
        value.set(0);
        assertSame(root.innerHTML, "<!--<>-->fallback<!--</>-->");
        value.set(1);
        assertSame(root.innerHTML, "<!--<>-->children<!--</>-->");
    });
    it("initializes single shown component and destroys single hidden component", (context) => {
        const value = signal(0);
        const initThen = context.mock.fn();
        const destroyThen = context.mock.fn();
        const initElse = context.mock.fn();
        const destroyElse = context.mock.fn();
        function Then() {
            initThen();
            onDestroy(destroyThen);
            return "then";
        }
        function Else() {
            initElse();
            onDestroy(destroyElse);
            return "else";
        }
        const condition = <If test={() => value.get() === 0} then={<Then />} else={<Else />}></If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        assertSame(initThen.mock.callCount(), 1);
        assertSame(initElse.mock.callCount(), 0);
        assertSame(destroyThen.mock.callCount(), 0);
        assertSame(destroyElse.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->then<!--</>-->");
        initThen.mock.resetCalls();

        value.set(1);
        assertSame(initThen.mock.callCount(), 0);
        assertSame(initElse.mock.callCount(), 1);
        assertSame(destroyThen.mock.callCount(), 1);
        assertSame(destroyElse.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->else<!--</>-->");
        initElse.mock.resetCalls();
        destroyThen.mock.resetCalls();

        value.set(0);
        assertGreaterThan(initThen.mock.callCount(), 0);
        assertSame(initElse.mock.callCount(), 0);
        assertSame(destroyThen.mock.callCount(), 0);
        assertSame(destroyElse.mock.callCount(), 1);
        assertSame(root.innerHTML, "<!--<>-->then<!--</>-->");
        initThen.mock.resetCalls();
        destroyElse.mock.resetCalls();

        value.set(1);
        assertSame(initThen.mock.callCount(), 0);
        assertSame(initElse.mock.callCount(), 1);
        assertSame(destroyThen.mock.callCount(), 1);
        assertSame(destroyElse.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->else<!--</>-->");
    });

    it("initializes multiple shown components and destroys multiple hidden components", (context) => {
        const value = signal(0);
        const initThen1 = context.mock.fn();
        const destroyThen1 = context.mock.fn();
        const initThen2 = context.mock.fn();
        const destroyThen2 = context.mock.fn();
        const initElse1 = context.mock.fn();
        const destroyElse1 = context.mock.fn();
        const initElse2 = context.mock.fn();
        const destroyElse2 = context.mock.fn();
        function Then1() {
            initThen1();
            onDestroy(destroyThen1);
            return "then1";
        }
        function Then2() {
            initThen2();
            onDestroy(destroyThen2);
            return <>then2</>;
        }
        function Else1() {
            initElse1();
            onDestroy(destroyElse1);
            return "else1";
        }
        function Else2() {
            initElse2();
            onDestroy(destroyElse2);
            return <>else2</>;
        }
        const condition = <If test={() => value.get() === 0} then={<><Then1 /><Then2 /></>} else={<><Else1 /><Else2 /></>}></If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        assertSame(initThen1.mock.callCount(), 1);
        assertSame(initElse1.mock.callCount(), 0);
        assertSame(destroyThen1.mock.callCount(), 0);
        assertSame(destroyElse1.mock.callCount(), 0);
        assertSame(initThen2.mock.callCount(), 1);
        assertSame(initElse2.mock.callCount(), 0);
        assertSame(destroyThen2.mock.callCount(), 0);
        assertSame(destroyElse2.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>--><!--<>-->then1<!--<>-->then2<!--</>--><!--</>--><!--</>-->");
        initThen1.mock.resetCalls();
        initThen2.mock.resetCalls();

        value.set(1);
        assertSame(initThen1.mock.callCount(), 0);
        assertSame(initElse1.mock.callCount(), 1);
        assertSame(destroyThen1.mock.callCount(), 1);
        assertSame(destroyElse1.mock.callCount(), 0);
        assertSame(initThen2.mock.callCount(), 0);
        assertSame(initElse2.mock.callCount(), 1);
        assertSame(destroyThen2.mock.callCount(), 1);
        assertSame(destroyElse2.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>--><!--<>-->else1<!--<>-->else2<!--</>--><!--</>--><!--</>-->");
        initElse1.mock.resetCalls();
        destroyThen1.mock.resetCalls();
        initElse2.mock.resetCalls();
        destroyThen2.mock.resetCalls();

        value.set(0);
        assertGreaterThan(initThen1.mock.callCount(), 0);
        assertSame(initElse1.mock.callCount(), 0);
        assertSame(destroyThen1.mock.callCount(), 0);
        assertSame(destroyElse1.mock.callCount(), 1);
        assertGreaterThan(initThen2.mock.callCount(), 0);
        assertSame(initElse2.mock.callCount(), 0);
        assertSame(destroyThen2.mock.callCount(), 0);
        assertSame(destroyElse2.mock.callCount(), 1);
        assertSame(root.innerHTML, "<!--<>--><!--<>-->then1<!--<>-->then2<!--</>--><!--</>--><!--</>-->");
        initThen1.mock.resetCalls();
        destroyElse1.mock.resetCalls();
        initThen2.mock.resetCalls();
        destroyElse2.mock.resetCalls();

        value.set(1);
        assertSame(initThen1.mock.callCount(), 0);
        assertSame(initElse1.mock.callCount(), 1);
        assertSame(destroyThen1.mock.callCount(), 1);
        assertSame(destroyElse1.mock.callCount(), 0);
        assertSame(initThen2.mock.callCount(), 0);
        assertSame(initElse2.mock.callCount(), 1);
        assertSame(destroyThen2.mock.callCount(), 1);
        assertSame(destroyElse2.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>--><!--<>-->else1<!--<>-->else2<!--</>--><!--</>--><!--</>-->");
    });

    it("initializes shown async components and destroys hidden async components", async (context) => {
        const value = signal(0);
        const initThen = context.mock.fn();
        const destroyThen = context.mock.fn();
        const initElse = context.mock.fn();
        const destroyElse = context.mock.fn();
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
        function Then(props: {}, depA: DepA) {
            initThen();
            onDestroy(destroyThen);
            return "then";
        }
        component(Then, { inject: [ DepA ] });
        function Else(props: {}, depX: DepX) {
            initElse();
            onDestroy(destroyElse);
            return "else";
        }
        component(Else, { inject: [ DepX ] });
        const condition = <If test={() => value.get() === 0} then={<Then />} else={<Else />}></If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        await sleep(0);
        assertSame(initThen.mock.callCount(), 1);
        assertSame(initElse.mock.callCount(), 0);
        assertSame(destroyThen.mock.callCount(), 0);
        assertSame(destroyElse.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->then<!--</>-->");
        initThen.mock.resetCalls();

        value.set(1);
        await sleep(0);
        assertSame(initThen.mock.callCount(), 0);
        assertSame(initElse.mock.callCount(), 1);
        assertSame(destroyThen.mock.callCount(), 1);
        assertSame(destroyElse.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->else<!--</>-->");
        initElse.mock.resetCalls();
        destroyThen.mock.resetCalls();

        value.set(0);
        await sleep(0);
        assertGreaterThan(initThen.mock.callCount(), 0);
        assertSame(initElse.mock.callCount(), 0);
        assertSame(destroyThen.mock.callCount(), 0);
        assertSame(destroyElse.mock.callCount(), 1);
        assertSame(root.innerHTML, "<!--<>-->then<!--</>-->");
        initThen.mock.resetCalls();
        destroyElse.mock.resetCalls();

        value.set(1);
        await sleep(0);
        assertSame(initThen.mock.callCount(), 0);
        assertSame(initElse.mock.callCount(), 1);
        assertSame(destroyThen.mock.callCount(), 1);
        assertSame(destroyElse.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->else<!--</>-->");
    });
});
