/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */


import { Context } from "@kayahr/cdi";
import { computed } from "@kayahr/signal";
import { describe, it } from "node:test";

import { FunctionComponent } from "../main/FunctionComponent.ts";
import { component } from "../main/utils/component.ts";
import { onDestroy } from "../main/utils/lifecycle.ts";
import { sleep } from "./support.ts";
import { assertSame, assertThrowWithMessage } from "@kayahr/assert";

describe("FunctionComponent", () => {
    describe("createNode", () => {
        it("calls component function with properties and renders the element", () => {
            const Component = ({ a, b }: { a: number, b: string }) => <div>a={a} b={b}</div>;
            const element = new FunctionComponent(Component, { a: 1, b: "foo" });
            const node = element.createNode() as HTMLElement;
            assertSame(node.outerHTML, "<div>a=1 b=foo</div>");
        });
        it("resolves component function synchronously from DI context if possible", () => {
            const context = Context.getActive();
            context.setValue("Jane", "name");
            const Component = (props: unknown, name: string) => <div>{name}</div>;
            component(Component, { inject: [ "name" ] });
            const element = new FunctionComponent(Component, {});
            const node = element.createNode() as HTMLElement;
            assertSame(node.outerHTML, "<div>Jane</div>");
        });
        it("resolves component function asynchronously from DI context if present and if function has asynchronous dependencies", async () => {
            const context = Context.getActive();
            const value = Promise.resolve("Jane");
            context.setValue(value, "name");
            const Component = (props: unknown, name: string) => <span>{name}</span>;
            component(Component, { inject: [ "name" ] });
            const element = new FunctionComponent(Component, {});
            const root = document.createElement("div");
            root.appendChild(element.createNode());
            assertSame(root.innerHTML, "<!---->");
            await sleep(); // Wait a macro task to ensure all involved promises are settled
            assertSame(root.innerHTML, "<span>Jane</span>");
        });
    });
    describe("renderSync", () => {
        it("renders into synchronous JSX element", () => {
            function Test() {
                return "test";
            }
            const component = new FunctionComponent(Test, {});
            const element = component.renderSync();
            assertSame(element, "test");
        });
        it("throws error when rendered into Promise", () => {
            function Test() {
                return Promise.resolve("test");
            }
            const component = new FunctionComponent(Test, {});
            assertThrowWithMessage(() => component.renderSync(), Error, "Synchronous rendering requested but promise encountered");
        });
    });
    it("calls onDestroy handler when component is destroyed", (context) => {
        const destroy = context.mock.fn();
        const Component = () => {
            onDestroy(destroy);
            return <div></div>;
        };
        const element = new FunctionComponent(Component, { a: 1, b: "foo" });
        element.createNode();
        assertSame(destroy.mock.callCount(), 0);
        element.destroy();
        assertSame(destroy.mock.callCount(), 1);
    });
    it("calls onDestroy handler when synchronous component created from DI context is destroyed", (context) => {
        const destroy = context.mock.fn();
        const Component = (props: unknown) => {
            onDestroy(destroy);
            return <div></div>;
        };
        component(Component, { inject: [] });
        const element = new FunctionComponent(Component, { a: 1, b: "foo" });
        element.createNode();
        assertSame(destroy.mock.callCount(), 0);
        element.destroy();
        assertSame(destroy.mock.callCount(), 1);
    });
    it("calls onDestroy handler when asynchronous component created from DI context is destroyed", async (t) => {
        const context = Context.getActive();
        const value = Promise.resolve("Jane");
        context.setValue(value, "name");
        const destroy = t.mock.fn();
        const Component = (props: unknown, name: string) => {
            onDestroy(destroy);
            return <div></div>;
        };
        component(Component, { inject: [ "name" ] });
        const element = new FunctionComponent(Component, { a: 1, b: "foo" });
        element.createNode();
        await sleep(); // Wait a macro task to ensure all involved promises are settled
        assertSame(destroy.mock.callCount(), 0);
        element.destroy();
        assertSame(destroy.mock.callCount(), 1);
    });
    it("does not destroy signals created in dependencies when component is destroyed", () => {
        class Dep {
            public readonly value = computed(() => 1 + 2);
        }
        Context.getActive().setClass(Dep);
        function Component(props: {}, dep: Dep) {
            return <>{() => dep.value.get()}</>;
        }
        component(Component, { inject: [ Dep ] });
        const element = new FunctionComponent(Component, {});
        element.createNode();
        element.destroy();
        assertSame(Context.getActive().getSync(Dep).value.get(), 3);
    });
});
