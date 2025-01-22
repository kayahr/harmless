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
        expect(root.outerHTML).toBe("<body></body>");
    });
    it("renders children when test expression returns true", () => {
        const condition = <If test={() => true}>{1}A</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.outerHTML).toBe("<body>1A</body>");
    });
    it("does not render children when test expression returns false", () => {
        const condition = <If test={() => false}>{1}A</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.outerHTML).toBe("<body></body>");
    });
    it("renders the `then` parameter when test expression returns true", () => {
        const condition = <If test={() => true} then={1}></If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.outerHTML).toBe("<body>1</body>");
    });
    it("renders the `then` parameter when test expression returns true and there is an else parameter", () => {
        const condition = <If test={() => true} then={1} else={2}></If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.outerHTML).toBe("<body>1</body>");
    });
    it("renders the `then` parameter when test expression returns true and ignores children", () => {
        const condition = <If test={() => true} then={1}>3</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.outerHTML).toBe("<body>1</body>");
    });
    it("renders the `else` parameter when test expression returns false", () => {
        const condition = <If test={() => false} then={1} else={2}>3</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.outerHTML).toBe("<body>2</body>");
    });
    it("dynamically switches content", () => {
        const value = signal(0);
        const condition = <If test={() => value() === 1} else="fallback">children</If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(root.outerHTML).toBe("<body>fallback</body>");
        value.set(1);
        expect(root.outerHTML).toBe("<body>children</body>");
        value.set(0);
        expect(root.outerHTML).toBe("<body>fallback</body>");
        value.set(1);
        expect(root.outerHTML).toBe("<body>children</body>");
    });
    it("initializes shown components and destroys hidden components", () => {
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
        const condition = <If test={() => value() === 0} then={<Then />} else={<Else />}></If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        expect(initThen).toHaveBeenCalledOnce();
        expect(initElse).not.toHaveBeenCalled();
        expect(destroyThen).not.toHaveBeenCalled();
        expect(destroyElse).not.toHaveBeenCalled();
        expect(root.outerHTML).toBe("<body>then</body>");
        initThen.mockClear();

        value.set(1);
        expect(initThen).not.toHaveBeenCalled();
        expect(initElse).toHaveBeenCalledOnce();
        expect(destroyThen).toHaveBeenCalledOnce();
        expect(destroyElse).not.toHaveBeenCalled();
        expect(root.outerHTML).toBe("<body>else</body>");
        initElse.mockClear();
        destroyThen.mockClear();

        value.set(0);
        expect(initThen).toHaveBeenCalled();
        expect(initElse).not.toHaveBeenCalled();
        expect(destroyThen).not.toHaveBeenCalled();
        expect(destroyElse).toHaveBeenCalledOnce();
        expect(root.outerHTML).toBe("<body>then</body>");
        initThen.mockClear();
        destroyElse.mockClear();

        value.set(1);
        expect(initThen).not.toHaveBeenCalled();
        expect(initElse).toHaveBeenCalledOnce();
        expect(destroyThen).toHaveBeenCalledOnce();
        expect(destroyElse).not.toHaveBeenCalled();
        expect(root.outerHTML).toBe("<body>else</body>");
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
        const condition = <If test={() => value() === 0} then={<Then />} else={<Else />}></If>;
        const root = document.createElement("body");
        root.appendChild(render(condition));
        await sleep(0);
        expect(initThen).toHaveBeenCalledOnce();
        expect(initElse).not.toHaveBeenCalled();
        expect(destroyThen).not.toHaveBeenCalled();
        expect(destroyElse).not.toHaveBeenCalled();
        expect(root.outerHTML).toBe("<body>then</body>");
        initThen.mockClear();

        value.set(1);
        await sleep(0);
        expect(initThen).not.toHaveBeenCalled();
        expect(initElse).toHaveBeenCalledOnce();
        expect(destroyThen).toHaveBeenCalledOnce();
        expect(destroyElse).not.toHaveBeenCalled();
        expect(root.outerHTML).toBe("<body>else</body>");
        initElse.mockClear();
        destroyThen.mockClear();

        value.set(0);
        await sleep(0);
        expect(initThen).toHaveBeenCalled();
        expect(initElse).not.toHaveBeenCalled();
        expect(destroyThen).not.toHaveBeenCalled();
        expect(destroyElse).toHaveBeenCalledOnce();
        expect(root.outerHTML).toBe("<body>then</body>");
        initThen.mockClear();
        destroyElse.mockClear();

        value.set(1);
        await sleep(0);
        expect(initThen).not.toHaveBeenCalled();
        expect(initElse).toHaveBeenCalledOnce();
        expect(destroyThen).toHaveBeenCalledOnce();
        expect(destroyElse).not.toHaveBeenCalled();
        expect(root.outerHTML).toBe("<body>else</body>");
    });
});
