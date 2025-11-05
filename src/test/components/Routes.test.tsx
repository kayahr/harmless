/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Context } from "@kayahr/cdi";
import { type Mock, describe, it } from "node:test";

import { Route, RouteParams, Routes } from "../../main/components/Route.ts";
import { component } from "../../main/utils/component.ts";
import { onDestroy } from "../../main/utils/lifecycle.ts";
import { render } from "../../main/utils/render.ts";
import { sleep } from "../support.ts";
import { assertGreaterThan, assertSame } from "@kayahr/assert";

describe("Routes", () => {
    it("renders empty node if empty", () => {
        const choose = <Routes></Routes>;
        const root = document.createElement("body");
        root.appendChild(render(choose));
        assertSame(root.innerHTML, "<!--<>--><!--</>-->");
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
        assertSame(root.innerHTML, "<!--<>-->B<!--</>-->");
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
        assertSame(root.innerHTML, "<!--<>--><!--<>-->Foo: foo, Bar: bar<!--</>--><!--</>-->");
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
        assertSame(root.innerHTML, "<!--<>--><!--<>-->Foo: foo, Bar: <!--</>--><!--</>-->");
        location.hash = "#/a/foo/bar";
        assertSame(root.innerHTML, "<!--<>--><!--<>-->Foo: foo, Bar: bar<!--</>--><!--</>-->");
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
        assertSame(root.innerHTML, "<!--<>-->Root<!--</>-->");
        location.hash = "#/a";
        assertSame(root.innerHTML, "<!--<>-->A<!--</>-->");
        location.hash = "#/b";
        assertSame(root.innerHTML, "<!--<>-->B<!--</>-->");
        location.hash = "#/";
        assertSame(root.innerHTML, "<!--<>-->Root<!--</>-->");
    });
    it("initializes shown components and destroys hidden components", (context) => {
        const initA = context.mock.fn();
        const destroyA = context.mock.fn();
        const initB = context.mock.fn();
        const destroyB = context.mock.fn();
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
        assertSame(initA.mock.callCount(), 1);
        assertSame(initB.mock.callCount(), 0);
        assertSame(destroyA.mock.callCount(), 0);
        assertSame(destroyB.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->A<!--</>-->");
        initA.mock.resetCalls();

        location.hash = "#/b";
        assertSame(initA.mock.callCount(), 0);
        assertSame(initB.mock.callCount(), 1);
        assertSame(destroyA.mock.callCount(), 1);
        assertSame(destroyB.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->B<!--</>-->");
        initB.mock.resetCalls();
        destroyA.mock.resetCalls();

        location.hash = "#/a";
        assertGreaterThan(initA.mock.callCount(), 0);
        assertSame(initB.mock.callCount(), 0);
        assertSame(destroyA.mock.callCount(), 0);
        assertSame(destroyB.mock.callCount(), 1);
        assertSame(root.innerHTML, "<!--<>-->A<!--</>-->");
        initA.mock.resetCalls();
        destroyB.mock.resetCalls();

        location.hash = "#/b";
        assertSame(initA.mock.callCount(), 0);
        assertSame(initB.mock.callCount(), 1);
        assertSame(destroyA.mock.callCount(), 1);
        assertSame(destroyB.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->B<!--</>-->");
    });

    it("initializes shown async components and destroys hidden async components", async (context) => {
        location.hash = "#/a";
        const initA = context.mock.fn();
        const destroyA = context.mock.fn();
        const initB = context.mock.fn();
        const destroyB = context.mock.fn();
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
        assertSame(initA.mock.callCount(), 1);
        assertSame(initB.mock.callCount(), 0);
        assertSame(destroyA.mock.callCount(), 0);
        assertSame(destroyB.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->A<!--</>-->");
        initA.mock.resetCalls();

        location.hash = "#/b";
        await sleep(0);
        assertSame(initA.mock.callCount(), 0);
        assertSame(initB.mock.callCount(), 1);
        assertSame(destroyA.mock.callCount(), 1);
        assertSame(destroyB.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->B<!--</>-->");
        initB.mock.resetCalls();
        destroyA.mock.resetCalls();

        location.hash = "#/a";
        await sleep(0);
        assertGreaterThan(initA.mock.callCount(), 0);
        assertSame(initB.mock.callCount(), 0);
        assertSame(destroyA.mock.callCount(), 0);
        assertSame(destroyB.mock.callCount(), 1);
        assertSame(root.innerHTML, "<!--<>-->A<!--</>-->");
        initA.mock.resetCalls();
        destroyB.mock.resetCalls();

        location.hash = "#/b";
        await sleep(0);
        assertSame(initA.mock.callCount(), 0);
        assertSame(initB.mock.callCount(), 1);
        assertSame(destroyA.mock.callCount(), 1);
        assertSame(destroyB.mock.callCount(), 0);
        assertSame(root.innerHTML, "<!--<>-->B<!--</>-->");
    });
    it("correctly handles switching between parameterized and non-parameterized routes", (context) => {
        const initRoot = context.mock.fn();
        const destroyRoot = context.mock.fn();
        const initParamsA = context.mock.fn();
        const destroyParamsA = context.mock.fn();
        const initParamsB = context.mock.fn();
        const destroyParamsB = context.mock.fn();

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

        function test(path: string, expected: string, ...calls: Array<Mock<Function>>): void {
            location.hash = path;
            assertSame(root.innerHTML, `<!--<>-->${expected}<!--</>-->`);
            assertSame(initRoot.mock.callCount(), calls.includes(initRoot) ? 1 : 0);
            assertSame(initParamsA.mock.callCount(), calls.includes(initParamsA) ? 1 : 0);
            assertSame(initParamsB.mock.callCount(), calls.includes(initParamsB) ? 1 : 0);
            assertSame(destroyRoot.mock.callCount(), calls.includes(destroyRoot) ? 1 : 0);
            assertSame(destroyParamsA.mock.callCount(), calls.includes(destroyParamsA) ? 1 : 0);
            assertSame(destroyParamsB.mock.callCount(), calls.includes(destroyParamsB) ? 1 : 0);
            calls.forEach(call => call.mock.resetCalls());
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
