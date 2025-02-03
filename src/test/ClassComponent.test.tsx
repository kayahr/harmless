/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import "@kayahr/vitest-matchers";

import { Context } from "@kayahr/cdi";
import { computed } from "@kayahr/signal";
import { describe, expect, it, vi } from "vitest";

import { ClassComponent, type ComponentClass, isComponentConstructor } from "../main/ClassComponent.js";
import { component } from "../main/utils/component.js";
import { onDestroy } from "../main/utils/lifecycle.js";
import type { Element } from "../main/utils/types.js";
import { sleep } from "./support.js";

describe("isElementClass", () => {
    it("returns true when object is a class with a render method, false otherwise", () => {
        expect(isComponentConstructor({ render: () => {} })).toBe(false);
        expect(isComponentConstructor(class {})).toBe(false);
        expect(isComponentConstructor({ prototype: { render: () => {} } })).toBe(false);
        expect(isComponentConstructor(() => {})).toBe(false);
        expect(isComponentConstructor(class { public render(): void {} })).toBe(true);
    });
});

describe("ClassComponent", () => {
    describe("createNode", () => {
        it("creates element class instance and renders it", () => {
            class Test implements ComponentClass {
                readonly #a: number;
                readonly #b: string;

                public constructor({ a, b }: { a: number, b: string }) {
                    this.#a = a;
                    this.#b = b;
                }

                public render(): Element {
                    return <div>a={this.#a} b={this.#b}</div>;
                }
            }
            const element = new ClassComponent(Test, { a: 12, b: "test" });
            const node = element.createNode() as HTMLElement;
            expect(node.outerHTML).toBe("<div>a=12 b=test</div>");
        });
        it("resolves component function synchronously from DI context if possible", () => {
            const context = Context.getActive();
            context.setValue("Jane", "name");
            class Component {
                public constructor(public props: { a: number }, public name: string) {}
                public render() {
                    return <div>{this.name} {this.props.a}</div>;
                }
            }
            component(Component, { inject: [ "name" ] });
            const element = new ClassComponent(Component, { a: 3 });
            const node = element.createNode() as HTMLElement;
            expect(node.outerHTML).toBe("<div>Jane 3</div>");
        });
        it("resolves component function asynchronously from DI context if present and if function has asynchronous dependencies", async () => {
            const context = Context.getActive();
            const value = Promise.resolve("Jane");
            context.setValue(value, "name");
            class Component {
                public constructor(public props: { a: number }, public name: string) {}
                public render() {
                    return <div>{this.name} {this.props.a}</div>;
                }
            }
            component(Component, { inject: [ "name" ] });
            const element = new ClassComponent(Component, { a: 2 });
            const root = document.createElement("div");
            root.appendChild(element.createNode());
            expect(root.innerHTML).toBe("<!---->");
            await sleep(); // Wait a macro task to ensure all involved promises are settled
            expect(root.innerHTML).toBe("<div>Jane 2</div>");
        });
        it("registers onDestroy method if present", () => {
            const destroy = vi.fn();
            class Test implements ComponentClass {
                public render(): Element {
                    return <div></div>;
                }

                public onDestroy(): void {
                    destroy();
                }
            }
            const element = new ClassComponent(Test, {});
            element.createNode() as HTMLElement;
            expect(destroy).not.toHaveBeenCalled();
            element.destroy();
            expect(destroy).toHaveBeenCalledOnce();
        });
    });
    describe("renderSync", () => {
        it("renders into synchronous JSX element", () => {
            class Test {
                public render() {
                    return "test";
                }
            }
            const component = new ClassComponent(Test, {});
            const element = component.renderSync();
            expect(element).toBe("test");
        });
        it("throws error when rendered into Promise", () => {
            class Test {
                public render() {
                    return Promise.resolve("test");
                }
            }
            const component = new ClassComponent(Test, {});
            expect(() => component.renderSync()).toThrowWithMessage(Error, "Synchronous rendering requested but promise encountered");
        });
    });
    it("calls onDestroy handler when component is destroyed", () => {
        const destroy = vi.fn();
        class Test implements ComponentClass {
            public render(): Element {
                onDestroy(destroy);
                return <div></div>;
            }
        }
        const element = new ClassComponent(Test, {});
        element.createNode();
        expect(destroy).not.toHaveBeenCalled();
        element.destroy();
        expect(destroy).toHaveBeenCalledOnce();
    });
    it("calls onDestroy handler when synchronous component created from DI context is destroyed", () => {
        const destroy = vi.fn();
        Context.getActive().setValue("Jane", "test");
        class Test implements ComponentClass {
            public constructor(public props: { a: number }, public name: string) {}

            public render(): Element {
                onDestroy(destroy);
                return <div>{this.name} {this.props.a}</div>;
            }
        }
        component(Test, { inject: [ "test" ] });
        const element = new ClassComponent(Test, { a: 4 });
        element.createNode();
        expect(destroy).not.toHaveBeenCalled();
        element.destroy();
        expect(destroy).toHaveBeenCalledOnce();
    });
    it("calls onDestroy handler when asynchronous component created from DI context is destroyed", async () => {
        const destroy = vi.fn();
        Context.getActive().setValue(Promise.resolve("Jane"), "test");
        class Test implements ComponentClass {
            public constructor(public props: { a: number }, public name: string) {}

            public render(): Element {
                onDestroy(destroy);
                return <div>{this.name} {this.props.a}</div>;
            }
        }
        component(Test, { inject: [ "test" ] });
        const element = new ClassComponent(Test, { a: 4 });
        element.createNode();
        await sleep(); // Wait a macro task to ensure all involved promises are settled
        expect(destroy).not.toHaveBeenCalled();
        element.destroy();
        expect(destroy).toHaveBeenCalledOnce();
    });
    it("does not destroy signals created in synchronous dependencies when component is destroyed", () => {
        class Dep {
            public readonly value = computed(() => 1 + 2);
        }
        Context.getActive().setClass(Dep);
        class Component {
            public constructor(props: {}, public dep: Dep) {}

            public render() {
                return <>{() => this.dep.value()}</>;
            }
        }
        component(Component, { inject: [ Dep ] });
        const element = new ClassComponent(Component, {});
        element.createNode();
        element.destroy();
        expect(Context.getActive().getSync(Dep).value()).toBe(3);
    });
});
