/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Context } from "@kayahr/cdi";
import { signal } from "@kayahr/signal";
import { describe, expect, it, vi } from "vitest";

import { Choose, Otherwise, When } from "../../main/components/Choose.js";
import { component } from "../../main/utils/component.js";
import { onDestroy } from "../../main/utils/lifecycle.js";
import { render } from "../../main/utils/render.js";
import { sleep } from "../support.js";

describe("Choose", () => {
    it("renders empty node if empty", () => {
        const choose = <Choose></Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        expect(root.outerHTML).toBe("<body></body>");
    });
    it("renders first <When> node that matches test expression", () => {
        const choose = <Choose>
            <When test={() => 1 > 1}>A</When>
            <When test={() => 2 > 1}>B</When>
            <When test={() => 3 > 1}>C</When>
            <Otherwise>X</Otherwise>
        </Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        expect(root.outerHTML).toBe("<body>B</body>");
    });
    it("renders first <Otherwise> node when no <When> node matches test expression", () => {
        const choose = <Choose>
            <When test={() => 1 < 1}>A</When>
            <When test={() => 2 < 1}>B</When>
            <When test={() => 3 < 1}>C</When>
            <Otherwise>X</Otherwise>
            <Otherwise>Y</Otherwise>
        </Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        expect(root.outerHTML).toBe("<body>X</body>");
    });
    it("renders <Otherwise> node when only child", () => {
        const choose = <Choose>
            <Otherwise>X</Otherwise>
        </Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        expect(root.outerHTML).toBe("<body>X</body>");
    });
    it("dynamically switches content", () => {
        const value = signal(0);
        const choose = <Choose>
            <When test={() => value() < 1}>A</When>
            <When test={() => value() < 2}>B</When>
            <When test={() => value() < 3}>C</When>
            <Otherwise>X</Otherwise>
        </Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        expect(root.outerHTML).toBe("<body>A</body>");
        value.set(1);
        expect(root.outerHTML).toBe("<body>B</body>");
        value.set(2);
        expect(root.outerHTML).toBe("<body>C</body>");
        value.set(3);
        expect(root.outerHTML).toBe("<body>X</body>");
    });
    it("initializes shown components and destroys hidden components", () => {
        const value = signal(0);
        const initA = vi.fn();
        const destroyA = vi.fn();
        const initX = vi.fn();
        const destroyX = vi.fn();
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
            <When test={() => value() < 1}><A /></When>
            <Otherwise><X /></Otherwise>
        </Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        expect(initA).toHaveBeenCalledOnce();
        expect(initX).not.toHaveBeenCalled();
        expect(destroyA).not.toHaveBeenCalled();
        expect(destroyX).not.toHaveBeenCalled();
        expect(root.outerHTML).toBe("<body>A</body>");
        initA.mockClear();

        value.set(1);
        expect(initA).not.toHaveBeenCalled();
        expect(initX).toHaveBeenCalledOnce();
        expect(destroyA).toHaveBeenCalledOnce();
        expect(destroyX).not.toHaveBeenCalled();
        expect(root.outerHTML).toBe("<body>X</body>");
        initX.mockClear();
        destroyA.mockClear();

        value.set(0);
        expect(initA).toHaveBeenCalled();
        expect(initX).not.toHaveBeenCalled();
        expect(destroyA).not.toHaveBeenCalled();
        expect(destroyX).toHaveBeenCalledOnce();
        expect(root.outerHTML).toBe("<body>A</body>");
        initA.mockClear();
        destroyX.mockClear();

        value.set(1);
        expect(initA).not.toHaveBeenCalled();
        expect(initX).toHaveBeenCalledOnce();
        expect(destroyA).toHaveBeenCalledOnce();
        expect(destroyX).not.toHaveBeenCalled();
        expect(root.outerHTML).toBe("<body>X</body>");
    });

    it("initializes shown async components and destroys hidden async components", async () => {
        const value = signal(0);
        const initA = vi.fn();
        const destroyA = vi.fn();
        const initX = vi.fn();
        const destroyX = vi.fn();
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
            <When test={() => value() < 1}><A /></When>
            <Otherwise><X /></Otherwise>
        </Choose>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        await sleep(0);
        expect(initA).toHaveBeenCalledOnce();
        expect(initX).not.toHaveBeenCalled();
        expect(destroyA).not.toHaveBeenCalled();
        expect(destroyX).not.toHaveBeenCalled();
        expect(root.outerHTML).toBe("<body>A</body>");
        initA.mockClear();

        value.set(1);
        await sleep(0);
        expect(initA).not.toHaveBeenCalled();
        expect(initX).toHaveBeenCalledOnce();
        expect(destroyA).toHaveBeenCalledOnce();
        expect(destroyX).not.toHaveBeenCalled();
        expect(root.outerHTML).toBe("<body>X</body>");
        initX.mockClear();
        destroyA.mockClear();

        value.set(0);
        await sleep(0);
        expect(initA).toHaveBeenCalled();
        expect(initX).not.toHaveBeenCalled();
        expect(destroyA).not.toHaveBeenCalled();
        expect(destroyX).toHaveBeenCalledOnce();
        expect(root.outerHTML).toBe("<body>A</body>");
        initA.mockClear();
        destroyX.mockClear();

        value.set(1);
        await sleep(0);
        expect(initA).not.toHaveBeenCalled();
        expect(initX).toHaveBeenCalledOnce();
        expect(destroyA).toHaveBeenCalledOnce();
        expect(destroyX).not.toHaveBeenCalled();
        expect(root.outerHTML).toBe("<body>X</body>");
    });
});
