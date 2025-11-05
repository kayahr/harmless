/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */


import { Context } from "@kayahr/cdi";
import { computed } from "@kayahr/signal";
import { describe, it } from "node:test";

import { ClassComponent, type ComponentClass, isComponentConstructor } from "../main/ClassComponent.ts";
import { component } from "../main/utils/component.ts";
import { onDestroy } from "../main/utils/lifecycle.ts";
import type { Element } from "../main/utils/types.ts";
import { sleep } from "./support.ts";
import { assertSame, assertThrowWithMessage } from "@kayahr/assert";

describe("isElementClass", () => {
    it("returns true when object is a class with a render method, false otherwise", () => {
        assertSame(isComponentConstructor({ render: () => {} }), false);
        assertSame(isComponentConstructor(class {}), false);
        assertSame(isComponentConstructor({ prototype: { render: () => {} } }), false);
        assertSame(isComponentConstructor(() => {}), false);
        assertSame(isComponentConstructor(class { public render(): void {} }), true);
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
            assertSame(node.outerHTML, "<div>a=12 b=test</div>");
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
            assertSame(node.outerHTML, "<div>Jane 3</div>");
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
            assertSame(root.innerHTML, "<!---->");
            await sleep(); // Wait a macro task to ensure all involved promises are settled
            assertSame(root.innerHTML, "<div>Jane 2</div>");
        });
        it("registers onDestroy method if present", (context) => {
            const destroy = context.mock.fn();
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
            assertSame(destroy.mock.callCount(), 0);
            element.destroy();
            assertSame(destroy.mock.callCount(), 1);
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
            assertSame(element, "test");
        });
        it("throws error when rendered into Promise", () => {
            class Test {
                public render() {
                    return Promise.resolve("test");
                }
            }
            const component = new ClassComponent(Test, {});
            assertThrowWithMessage(() => component.renderSync(), Error, "Synchronous rendering requested but promise encountered");
        });
    });
    it("calls onDestroy handler when component is destroyed", (context) => {
        const destroy = context.mock.fn();
        class Test implements ComponentClass {
            public render(): Element {
                onDestroy(destroy);
                return <div></div>;
            }
        }
        const element = new ClassComponent(Test, {});
        element.createNode();
        assertSame(destroy.mock.callCount(), 0);
        element.destroy();
        assertSame(destroy.mock.callCount(), 1);
    });
    it("calls onDestroy handler when synchronous component created from DI context is destroyed", (context) => {
        const destroy = context.mock.fn();
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
        assertSame(destroy.mock.callCount(), 0);
        element.destroy();
        assertSame(destroy.mock.callCount(), 1);
    });
    it("calls onDestroy handler when asynchronous component created from DI context is destroyed", async (context) => {
        const destroy = context.mock.fn();
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
        assertSame(destroy.mock.callCount(), 0);
        element.destroy();
        assertSame(destroy.mock.callCount(), 1);
    });
    it("does not destroy signals created in synchronous dependencies when component is destroyed", () => {
        class Dep {
            public readonly value = computed(() => 1 + 2);
        }
        Context.getActive().setClass(Dep);
        class Component {
            public constructor(props: {}, public dep: Dep) {}

            public render() {
                return <>{() => this.dep.value.get()}</>;
            }
        }
        component(Component, { inject: [ Dep ] });
        const element = new ClassComponent(Component, {});
        element.createNode();
        element.destroy();
        assertSame(Context.getActive().getSync(Dep).value.get(), 3);
    });
});
