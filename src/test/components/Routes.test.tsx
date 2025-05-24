/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Context } from "@kayahr/cdi";
import { describe, expect, it, type Mock, vi } from "vitest";

import { Route, RouteParams, Routes } from "../../main/components/Route.js";
import { component } from "../../main/utils/component.js";
import { onDestroy } from "../../main/utils/lifecycle.js";
import { render } from "../../main/utils/render.js";
import { sleep } from "../support.js";

describe("Routes", () => {
    it("renders empty node if empty", () => {
        const choose = <Routes></Routes>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        expect(root.innerHTML).toBe("<!--<>--><!--</>-->");
    });
    it("renders first <Route> node that matches active path", () => {
        location.hash = "#/b";
        const choose = <Routes>
            <Route path="/">Root</Route>
            <Route path="/a">A</Route>
            <Route path="/b">B</Route>
            <Route path="/c">C</Route>
            <Route path="/b">B2</Route>
            <Route path="/a">A2</Route>
        </Routes>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        expect(root.innerHTML).toBe("<!--<>-->B<!--</>-->");
    });
    it("captures route parameters", () => {
        location.hash = "#/a/foo/bar";
        function Component(props: {}, params: RouteParams<{ param1: string, param2: string }>) {
            return <>Foo: {() => params.get().param1}, Bar: {() => params.get().param2}</>;
        }
        component(Component, { inject: [ RouteParams ] });
        const choose = <Routes>
            <Route path="/a/:param1/:param2"><Component /></Route>
        </Routes>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        expect(root.innerHTML).toBe("<!--<>--><!--<>-->Foo: foo, Bar: bar<!--</>--><!--</>-->");
    });
    it("captures optional parameters", () => {
        location.hash = "#/a/foo";
        function Component(props: {}, params: RouteParams<{ param1: string, param2?: string }>) {
            return <>Foo: {() => params.get().param1}, Bar: {() => params.get().param2}</>;
        }
        component(Component, { inject: [ RouteParams ] });
        const choose = <Routes>
            <Route path="/a/:param1/:param2?"><Component /></Route>
        </Routes>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        expect(root.innerHTML).toBe("<!--<>--><!--<>-->Foo: foo, Bar: <!--</>--><!--</>-->");
        location.hash = "#/a/foo/bar";
        expect(root.innerHTML).toBe("<!--<>--><!--<>-->Foo: foo, Bar: bar<!--</>--><!--</>-->");
    });
    it("dynamically switches routes", () => {
        location.hash = "#/";
        const choose = <Routes>
            <Route path="/">Root</Route>
            <Route path="/a">A</Route>
            <Route path="/b">B</Route>
            <Route path="/c">C</Route>
            <Route path="/b">B2</Route>
            <Route path="/a">A2</Route>
        </Routes>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        expect(root.innerHTML).toBe("<!--<>-->Root<!--</>-->");
        location.hash = "#/a";
        expect(root.innerHTML).toBe("<!--<>-->A<!--</>-->");
        location.hash = "#/b";
        expect(root.innerHTML).toBe("<!--<>-->B<!--</>-->");
        location.hash = "#/";
        expect(root.innerHTML).toBe("<!--<>-->Root<!--</>-->");
    });
    it("initializes shown components and destroys hidden components", () => {
        const initA = vi.fn();
        const destroyA = vi.fn();
        const initB = vi.fn();
        const destroyB = vi.fn();
        function A() {
            initA();
            onDestroy(destroyA);
            return "A";
        }
        function B() {
            initB();
            onDestroy(destroyB);
            return "B";
        }
        location.hash = "#/a";
        const choose = <Routes>
            <Route path="/a"><A /></Route>
            <Route path="/b"><B /></Route>
        </Routes>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        expect(initA).toHaveBeenCalledOnce();
        expect(initB).not.toHaveBeenCalled();
        expect(destroyA).not.toHaveBeenCalled();
        expect(destroyB).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>-->A<!--</>-->");
        initA.mockClear();

        location.hash = "#/b";
        expect(initA).not.toHaveBeenCalled();
        expect(initB).toHaveBeenCalledOnce();
        expect(destroyA).toHaveBeenCalledOnce();
        expect(destroyB).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>-->B<!--</>-->");
        initB.mockClear();
        destroyA.mockClear();

        location.hash = "#/a";
        expect(initA).toHaveBeenCalled();
        expect(initB).not.toHaveBeenCalled();
        expect(destroyA).not.toHaveBeenCalled();
        expect(destroyB).toHaveBeenCalledOnce();
        expect(root.innerHTML).toBe("<!--<>-->A<!--</>-->");
        initA.mockClear();
        destroyB.mockClear();

        location.hash = "#/b";
        expect(initA).not.toHaveBeenCalled();
        expect(initB).toHaveBeenCalledOnce();
        expect(destroyA).toHaveBeenCalledOnce();
        expect(destroyB).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>-->B<!--</>-->");
    });

    it("initializes shown async components and destroys hidden async components", async () => {
        location.hash = "#/a";
        const initA = vi.fn();
        const destroyA = vi.fn();
        const initB = vi.fn();
        const destroyB = vi.fn();
        class DepA {
            public static create(): Promise<DepA> {
                return Promise.resolve(new DepA());
            }
        }
        Context.getActive().setFactory(DepA, DepA.create);
        class DepB {
            public static create(): Promise<DepB> {
                return Promise.resolve(new DepB());
            }
        }
        Context.getActive().setFactory(DepB, DepB.create);
        function A(props: {}, depA: DepA) {
            initA();
            onDestroy(destroyA);
            return "A";
        }
        component(A, { inject: [ DepA ] });
        function B(props: {}, depX: DepB) {
            initB();
            onDestroy(destroyB);
            return "B";
        }
        component(B, { inject: [ DepB ] });
        const choose = <Routes>
            <Route path="/a"><A /></Route>
            <Route path="/b"><B /></Route>
        </Routes>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        await sleep(0);
        expect(initA).toHaveBeenCalledOnce();
        expect(initB).not.toHaveBeenCalled();
        expect(destroyA).not.toHaveBeenCalled();
        expect(destroyB).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>-->A<!--</>-->");
        initA.mockClear();

        location.hash = "#/b";
        await sleep(0);
        expect(initA).not.toHaveBeenCalled();
        expect(initB).toHaveBeenCalledOnce();
        expect(destroyA).toHaveBeenCalledOnce();
        expect(destroyB).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>-->B<!--</>-->");
        initB.mockClear();
        destroyA.mockClear();

        location.hash = "#/a";
        await sleep(0);
        expect(initA).toHaveBeenCalled();
        expect(initB).not.toHaveBeenCalled();
        expect(destroyA).not.toHaveBeenCalled();
        expect(destroyB).toHaveBeenCalledOnce();
        expect(root.innerHTML).toBe("<!--<>-->A<!--</>-->");
        initA.mockClear();
        destroyB.mockClear();

        location.hash = "#/b";
        await sleep(0);
        expect(initA).not.toHaveBeenCalled();
        expect(initB).toHaveBeenCalledOnce();
        expect(destroyA).toHaveBeenCalledOnce();
        expect(destroyB).not.toHaveBeenCalled();
        expect(root.innerHTML).toBe("<!--<>-->B<!--</>-->");
    });
    it("correctly handles switching between parameterized and non-parameterized routes", () => {
        const initRoot = vi.fn();
        const destroyRoot = vi.fn();
        const initParamsA = vi.fn();
        const destroyParamsA = vi.fn();
        const initParamsB = vi.fn();
        const destroyParamsB = vi.fn();

        function Root() {
            initRoot();
            onDestroy(destroyRoot);
            return <>Root</>;
        }
        function ParamsA(props: {}, params: RouteParams<{ a: string }>) {
            initParamsA();
            onDestroy(destroyParamsA);
            return <>ParamsA: {() => params.get().a }</>;
        }
        component(ParamsA, { inject: [ RouteParams ] });
        class ParamsB {
            public constructor(props: {}, public params: RouteParams<{ b: string }>) {}

            public render() {
                initParamsB();
                onDestroy(destroyParamsB);
                return <>ParamsB: {() => this.params.get().b }</>;
            }
        }
        component(ParamsB, { inject: [ RouteParams ] });

        const choose = <Routes>
            <Route path="/"><Root /></Route>
            <Route path="/a">A</Route>
            <Route path="/a/:a"><ParamsA /></Route>
            <Route path="/b/:b"><ParamsB /></Route>
        </Routes>;

        const root = document.createElement("body");
        root.appendChild(render(choose));

        function test(path: string, expected: string, ...calls: Mock[]): void {
            location.hash = path;
            expect(root.innerHTML).toBe(`<!--<>-->${expected}<!--</>-->`);
            expect(initRoot).toHaveBeenCalledTimes(calls.includes(initRoot) ? 1 : 0);
            expect(initParamsA).toHaveBeenCalledTimes(calls.includes(initParamsA) ? 1 : 0);
            expect(initParamsB).toHaveBeenCalledTimes(calls.includes(initParamsB) ? 1 : 0);
            expect(destroyRoot).toHaveBeenCalledTimes(calls.includes(destroyRoot) ? 1 : 0);
            expect(destroyParamsA).toHaveBeenCalledTimes(calls.includes(destroyParamsA) ? 1 : 0);
            expect(destroyParamsB).toHaveBeenCalledTimes(calls.includes(destroyParamsB) ? 1 : 0);
            calls.forEach(call => call.mockClear());
        }
        test("#/", "<!--<>-->Root<!--</>-->", initRoot);
        test("#/a/foo", "<!--<>-->ParamsA: foo<!--</>-->", destroyRoot, initParamsA);
        test("#/a/bar", "<!--<>-->ParamsA: bar<!--</>-->");
        test("#/b/foo", "<!--<>-->ParamsB: foo<!--</>-->", destroyParamsA, initParamsB);
        test("#/", "<!--<>-->Root<!--</>-->", destroyParamsB, initRoot);
        test("#/b/bar", "<!--<>-->ParamsB: bar<!--</>-->", destroyRoot, initParamsB);
        test("#/a", "A", destroyParamsB);
        test("#/a/1", "<!--<>-->ParamsA: 1<!--</>-->", initParamsA);
        test("#/a", "A", destroyParamsA);
        test("#/a/2", "<!--<>-->ParamsA: 2<!--</>-->", initParamsA);
    });
});
