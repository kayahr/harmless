/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import "@kayahr/vitest-matchers";

import { Context } from "@kayahr/cdi";
import { computed } from "@kayahr/signal";
import { describe, expect, it, vi } from "vitest";

import { FunctionComponent } from "../main/FunctionComponent.js";
import { component } from "../main/utils/component.js";
import { onDestroy } from "../main/utils/lifecycle.js";
import { sleep } from "./support.js";

describe("FunctionComponent", () => {
    describe("createNode", () => {
        it("calls component function with properties and renders the element", () => {
            const Component = ({ a, b }: { a: number, b: string }) => <div>a={a} b={b}</div>;
            const element = new FunctionComponent(Component, { a: 1, b: "foo" });
            const node = element.createNode() as HTMLElement;
            expect(node.outerHTML).toBe("<div>a=1 b=foo</div>");
        });
        it("resolves component function synchronously from DI context if possible", () => {
            const context = Context.getActive();
            context.setValue("Jane", "name");
            const Component = (props: unknown, name: string) => <div>{name}</div>;
            component(Component, { inject: [ "name" ] });
            const element = new FunctionComponent(Component, {});
            const node = element.createNode() as HTMLElement;
            expect(node.outerHTML).toBe("<div>Jane</div>");
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
            expect(root.innerHTML).toBe("<!---->");
            await sleep(); // Wait a macro task to ensure all involved promises are settled
            expect(root.innerHTML).toBe("<span>Jane</span>");
        });
    });
    describe("renderSync", () => {
        it("renders into synchronous JSX element", () => {
            function Test() {
                return "test";
            }
            const component = new FunctionComponent(Test, {});
            const element = component.renderSync();
            expect(element).toBe("test");
        });
        it("throws error when rendered into Promise", () => {
            function Test() {
                return Promise.resolve("test");
            }
            const component = new FunctionComponent(Test, {});
            expect(() => component.renderSync()).toThrowWithMessage(Error, "Synchronous rendering requested but promise encountered");
        });
    });
    it("calls onDestroy handler when component is destroyed", () => {
        const destroy = vi.fn();
        const Component = () => {
            onDestroy(destroy);
            return <div></div>;
        };
        const element = new FunctionComponent(Component, { a: 1, b: "foo" });
        element.createNode();
        expect(destroy).not.toHaveBeenCalled();
        element.destroy();
        expect(destroy).toHaveBeenCalledOnce();
    });
    it("calls onDestroy handler when synchronous component created from DI context is destroyed", () => {
        const destroy = vi.fn();
        const Component = (props: unknown) => {
            onDestroy(destroy);
            return <div></div>;
        };
        component(Component, { inject: [] });
        const element = new FunctionComponent(Component, { a: 1, b: "foo" });
        element.createNode();
        expect(destroy).not.toHaveBeenCalled();
        element.destroy();
        expect(destroy).toHaveBeenCalledOnce();
    });
    it("calls onDestroy handler when asynchronous component created from DI context is destroyed", async () => {
        const context = Context.getActive();
        const value = Promise.resolve("Jane");
        context.setValue(value, "name");
        const destroy = vi.fn();
        const Component = (props: unknown, name: string) => {
            onDestroy(destroy);
            return <div></div>;
        };
        component(Component, { inject: [ "name" ] });
        const element = new FunctionComponent(Component, { a: 1, b: "foo" });
        element.createNode();
        await sleep(); // Wait a macro task to ensure all involved promises are settled
        expect(destroy).not.toHaveBeenCalled();
        element.destroy();
        expect(destroy).toHaveBeenCalledOnce();
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
        expect(Context.getActive().getSync(Dep).value.get()).toBe(3);
    });
});
