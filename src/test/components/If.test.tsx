/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Context } from "@kayahr/cdi";
import { signal } from "@kayahr/signal";
import { describe, expect, it, vi } from "vitest";

import { If } from "../../main/components/If.js";
import { component } from "../../main/utils/component.js";
import { onDestroy } from "../../main/utils/lifecycle.js";
import { render } from "../../main/utils/render.js";
import { sleep } from "../support.js";

describe("If", () => {
    it("renders nothing if empty", () => {
        const condition = <If test={() => true}></If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.innerHTML).toBe("<!--<>--><!--</>-->");
    });
    it("renders children when test expression returns true", () => {
        const condition = <If test={() => true}>{1}A</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.innerHTML).toBe("<!--<>--><!--<>-->1A<!--</>--><!--</>-->");
    });
    it("does not render children when test expression returns false", () => {
        const condition = <If test={() => false}>{1}A</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.innerHTML).toBe("<!--<>--><!--</>-->");
    });
    it("renders the `then` parameter when test expression returns true", () => {
        const condition = <If test={() => true} then={1}></If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.innerHTML).toBe("<!--<>-->1<!--</>-->");
    });
    it("renders the `then` parameter when test expression returns true and there is an else parameter", () => {
        const condition = <If test={() => true} then={1} else={2}></If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.innerHTML).toBe("<!--<>-->1<!--</>-->");
    });
    it("renders the `then` parameter when test expression returns true and ignores children", () => {
        const condition = <If test={() => true} then={1}>3</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.innerHTML).toBe("<!--<>-->1<!--</>-->");
    });
    it("renders the `else` parameter when test expression returns false", () => {
        const condition = <If test={() => false} then={1} else={2}>3</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.innerHTML).toBe("<!--<>-->2<!--</>-->");
    });
    it("dynamically switches content", () => {
        const value = signal(0);
        const condition = <If test={() => value.get() === 1} else="fallback">children</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.innerHTML).toBe("<!--<>-->fallback<!--</>-->");
        value.set(1);
        expect(root.innerHTML).toBe("<!--<>-->children<!--</>-->");
        value.set(0);
        expect(root.innerHTML).toBe("<!--<>-->fallback<!--</>-->");
        value.set(1);
        expect(root.innerHTML).toBe("<!--<>-->children<!--</>-->");
    });
    it("initializes single shown component and destroys single hidden component", () => {
        const value = signal(0);
        const initThen = vi.fn();
        const destroyThen = vi.fn();
        const initElse = vi.fn();
        const destroyElse = vi.fn();
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
        expect(initThen).toHaveBeenCalledOnce();
        expect(initElse).not.toHaveBeenCalled();
        expect(destroyThen).not.toHaveBeenCalled();
        expect(destroyElse).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>-->then<!--</>-->");
        initThen.mockClear();

        value.set(1);
        expect(initThen).not.toHaveBeenCalled();
        expect(initElse).toHaveBeenCalledOnce();
        expect(destroyThen).toHaveBeenCalledOnce();
        expect(destroyElse).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>-->else<!--</>-->");
        initElse.mockClear();
        destroyThen.mockClear();

        value.set(0);
        expect(initThen).toHaveBeenCalled();
        expect(initElse).not.toHaveBeenCalled();
        expect(destroyThen).not.toHaveBeenCalled();
        expect(destroyElse).toHaveBeenCalledOnce();
        expect(root.innerHTML).toBe("<!--<>-->then<!--</>-->");
        initThen.mockClear();
        destroyElse.mockClear();

        value.set(1);
        expect(initThen).not.toHaveBeenCalled();
        expect(initElse).toHaveBeenCalledOnce();
        expect(destroyThen).toHaveBeenCalledOnce();
        expect(destroyElse).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>-->else<!--</>-->");
    });

    it("initializes multiple shown components and destroys multiple hidden components", () => {
        const value = signal(0);
        const initThen1 = vi.fn();
        const destroyThen1 = vi.fn();
        const initThen2 = vi.fn();
        const destroyThen2 = vi.fn();
        const initElse1 = vi.fn();
        const destroyElse1 = vi.fn();
        const initElse2 = vi.fn();
        const destroyElse2 = vi.fn();
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
        expect(initThen1).toHaveBeenCalledOnce();
        expect(initElse1).not.toHaveBeenCalled();
        expect(destroyThen1).not.toHaveBeenCalled();
        expect(destroyElse1).not.toHaveBeenCalled();
        expect(initThen2).toHaveBeenCalledOnce();
        expect(initElse2).not.toHaveBeenCalled();
        expect(destroyThen2).not.toHaveBeenCalled();
        expect(destroyElse2).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>--><!--<>-->then1<!--<>-->then2<!--</>--><!--</>--><!--</>-->");
        initThen1.mockClear();
        initThen2.mockClear();

        value.set(1);
        expect(initThen1).not.toHaveBeenCalled();
        expect(initElse1).toHaveBeenCalledOnce();
        expect(destroyThen1).toHaveBeenCalledOnce();
        expect(destroyElse1).not.toHaveBeenCalled();
        expect(initThen2).not.toHaveBeenCalled();
        expect(initElse2).toHaveBeenCalledOnce();
        expect(destroyThen2).toHaveBeenCalledOnce();
        expect(destroyElse2).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>--><!--<>-->else1<!--<>-->else2<!--</>--><!--</>--><!--</>-->");
        initElse1.mockClear();
        destroyThen1.mockClear();
        initElse2.mockClear();
        destroyThen2.mockClear();

        value.set(0);
        expect(initThen1).toHaveBeenCalled();
        expect(initElse1).not.toHaveBeenCalled();
        expect(destroyThen1).not.toHaveBeenCalled();
        expect(destroyElse1).toHaveBeenCalledOnce();
        expect(initThen2).toHaveBeenCalled();
        expect(initElse2).not.toHaveBeenCalled();
        expect(destroyThen2).not.toHaveBeenCalled();
        expect(destroyElse2).toHaveBeenCalledOnce();
        expect(root.innerHTML).toBe("<!--<>--><!--<>-->then1<!--<>-->then2<!--</>--><!--</>--><!--</>-->");
        initThen1.mockClear();
        destroyElse1.mockClear();
        initThen2.mockClear();
        destroyElse2.mockClear();

        value.set(1);
        expect(initThen1).not.toHaveBeenCalled();
        expect(initElse1).toHaveBeenCalledOnce();
        expect(destroyThen1).toHaveBeenCalledOnce();
        expect(destroyElse1).not.toHaveBeenCalled();
        expect(initThen2).not.toHaveBeenCalled();
        expect(initElse2).toHaveBeenCalledOnce();
        expect(destroyThen2).toHaveBeenCalledOnce();
        expect(destroyElse2).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>--><!--<>-->else1<!--<>-->else2<!--</>--><!--</>--><!--</>-->");
    });

    it("initializes shown async components and destroys hidden async components", async () => {
        const value = signal(0);
        const initThen = vi.fn();
        const destroyThen = vi.fn();
        const initElse = vi.fn();
        const destroyElse = vi.fn();
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
        expect(initThen).toHaveBeenCalledOnce();
        expect(initElse).not.toHaveBeenCalled();
        expect(destroyThen).not.toHaveBeenCalled();
        expect(destroyElse).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>-->then<!--</>-->");
        initThen.mockClear();

        value.set(1);
        await sleep(0);
        expect(initThen).not.toHaveBeenCalled();
        expect(initElse).toHaveBeenCalledOnce();
        expect(destroyThen).toHaveBeenCalledOnce();
        expect(destroyElse).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>-->else<!--</>-->");
        initElse.mockClear();
        destroyThen.mockClear();

        value.set(0);
        await sleep(0);
        expect(initThen).toHaveBeenCalled();
        expect(initElse).not.toHaveBeenCalled();
        expect(destroyThen).not.toHaveBeenCalled();
        expect(destroyElse).toHaveBeenCalledOnce();
        expect(root.innerHTML).toBe("<!--<>-->then<!--</>-->");
        initThen.mockClear();
        destroyElse.mockClear();

        value.set(1);
        await sleep(0);
        expect(initThen).not.toHaveBeenCalled();
        expect(initElse).toHaveBeenCalledOnce();
        expect(destroyThen).toHaveBeenCalledOnce();
        expect(destroyElse).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>-->else<!--</>-->");
    });
});
