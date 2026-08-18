/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import "./dom.ts";
import { injector } from "@kayahr/di";
import { assertInstanceOf, assertSame, assertThrowWithMessage } from "@kayahr/assert";
import { createScope, dispose } from "@kayahr/scope";
import { SignalError, createMemo, createSignal } from "@kayahr/signal";
import { describe, it } from "node:test";
import { component } from "../main/component.ts";
import { ComponentContext } from "../main/jsx.ts";
import { render } from "../main/render.ts";

class ServiceA {
    public readonly value = "A";

    public getKind(): "A" {
        return "A";
    }
}

class ServiceB {
    public readonly value = "B";

    public getKind(): "B" {
        return "B";
    }
}

describe("component", () => {
    async function nextTick(): Promise<void> {
        await new Promise<void>(resolve => {
            setTimeout(resolve, 0);
        });
    }

    it("injects function component dependencies from DI and lets context appear after other dependencies", () => {
        let disposed = 0;

        function HelloWorld(props: { name: string }, service: ServiceA, context: ComponentContext) {
            context.onDispose(() => {
                disposed++;
            });
            return <h1>Hello {props.name} {service.value}</h1>;
        }
        component(HelloWorld, [ ServiceA, ComponentContext ]);

        const scope = createScope();
        injector.setClass(ServiceA, { scope });
        try {
            const node = scope.run(() => render(<HelloWorld name="World" />));

            assertInstanceOf(node, HTMLHeadingElement);
            assertSame(node.textContent, "Hello World A");

            dispose(node);

            assertSame(disposed, 1);
        } finally {
            scope.dispose();
        }
    });

    it("keeps explicit DI ordering unchanged when component metadata exists without context", () => {
        function HelloWorld(props: { name: string }, service: ServiceA) {
            return <h1>Hello {props.name} {service.value}</h1>;
        }
        component(HelloWorld, [ ServiceA ]);

        const scope = createScope();
        injector.setClass(ServiceA, { scope });
        try {
            const node = scope.run(() => render(<HelloWorld name="World" />));

            assertInstanceOf(node, HTMLHeadingElement);
            assertSame(node.textContent, "Hello World A");
        } finally {
            scope.dispose();
        }
    });

    it("keeps the owning DI scope when reactive content remounts a component", () => {
        const [ visible, setVisible ] = createSignal(true);

        function Content(props: Record<string, never>, service: ServiceA) {
            return <span>{service.value}</span>;
        }
        component(Content, [ ServiceA ]);

        const scope = createScope();
        injector.setClass(ServiceA, { scope });
        try {
            const node = scope.run(() => render(<div>{() => visible() ? <Content /> : null}</div>));

            assertSame(node.textContent, "A");
            setVisible(false);
            assertSame(node.textContent, "");
            setVisible(true);
            assertSame(node.textContent, "A");
        } finally {
            scope.dispose();
        }
    });

    it("injects class component dependencies from DI and lets context appear after other dependencies", () => {
        let disposed = 0;

        class HelloWorld {
            readonly #service: ServiceA;
            readonly #name: string;

            public constructor(props: { name: string }, service: ServiceA, context: ComponentContext) {
                this.#service = service;
                this.#name = props.name;
                context.onDispose(() => {
                    disposed++;
                });
            }

            public render() {
                return <h1>Hello {this.#name} {this.#service.value}</h1>;
            }
        }
        component(HelloWorld, [ ServiceA, ComponentContext ]);

        const scope = createScope();
        injector.setClass(ServiceA, { scope });
        try {
            const node = scope.run(() => render(<HelloWorld name="World" />));

            assertInstanceOf(node, HTMLHeadingElement);
            assertSame(node.textContent, "Hello World A");

            dispose(node);

            assertSame(disposed, 1);
        } finally {
            scope.dispose();
        }
    });

    it("renders function components later when injected dependencies are asynchronous", async () => {
        let localMemo: (() => string) | undefined;

        function HelloWorld(props: { name: string }, service: ServiceA) {
            localMemo = createMemo(() => service.value);
            return <h1>Hello {props.name} {localMemo}</h1>;
        }
        component(HelloWorld, [ ServiceA ]);

        const scope = createScope();
        injector.setFactory(ServiceA, async () => {
            await nextTick();
            return new ServiceA();
        }, { scope });
        try {
            const host = document.createElement("div");
            const node = scope.run(() => render(<HelloWorld name="World" />));
            host.appendChild(node);

            assertSame(host.textContent, "");

            await nextTick();
            await nextTick();

            assertSame(host.textContent, "Hello World A");
            if (localMemo == null) {
                throw new Error("Expected component memo to be assigned");
            }
            const disposedMemo = localMemo;

            dispose(node);

            assertThrowWithMessage(() => disposedMemo(), SignalError, "Cannot read a disposed memo");
        } finally {
            scope.dispose();
        }
    });

    it("does not materialize components after asynchronous dependencies resolve following disposal", async () => {
        let resolveService!: (service: ServiceA) => void;
        let componentCalls = 0;

        function HelloWorld(props: { name: string }, service: ServiceA) {
            componentCalls++;
            return <h1>Hello {props.name} {service.value}</h1>;
        }
        component(HelloWorld, [ ServiceA ]);

        const scope = createScope();
        injector.setFactory(ServiceA, () => new Promise<ServiceA>(resolve => {
            resolveService = resolve;
        }), { scope });
        try {
            const node = scope.run(() => render(<HelloWorld name="World" />));

            dispose(node);
            resolveService(new ServiceA());
            await nextTick();

            assertSame(componentCalls, 0);
        } finally {
            scope.dispose();
        }
    });

    it("renders class components later when injected dependencies are asynchronous", async () => {
        class HelloWorld {
            readonly #text: string;

            public constructor(props: { name: string }, service: ServiceA) {
                this.#text = `Hello ${props.name} ${service.value}`;
            }

            public render() {
                return <h1>{this.#text}</h1>;
            }
        }
        component(HelloWorld, [ ServiceA ]);

        const scope = createScope();
        injector.setFactory(ServiceA, async () => {
            await nextTick();
            return new ServiceA();
        }, { scope });
        try {
            const host = document.createElement("div");
            host.appendChild(scope.run(() => render(<HelloWorld name="World" />)));

            assertSame(host.textContent, "");

            await nextTick();
            await nextTick();

            assertSame(host.textContent, "Hello World A");
        } finally {
            scope.dispose();
        }
    });

    it("keeps direct function calls fully explicit for unit tests", () => {
        let disposed = 0;

        function HelloWorld(props: { name: string }, service: ServiceA, context: ComponentContext, suffix: ServiceB) {
            context.onDispose(() => {
                disposed++;
            });
            return <h1>Hello {props.name} {service.value}{suffix.value}</h1>;
        }
        component(HelloWorld, [ ServiceA, ComponentContext, ServiceB ]);

        const result = HelloWorld(
            { name: "World" },
            new ServiceA(),
            {
                onDispose(cleanup) {
                    cleanup();
                }
            },
            new ServiceB()
        );

        const node = render(result);
        assertInstanceOf(node, HTMLHeadingElement);
        assertSame(node.textContent, "Hello World AB");
        assertSame(disposed, 1);
    });

    it("requires dependency arrays matching the component dependency parameters", () => {
        const dummy = () => {
            function Test1(props: { value: string }, serviceA: ServiceA, context: ComponentContext, serviceB: ServiceB) {
                return `${props.value} ${serviceA.value} ${serviceB.value}`;
            }
            component(Test1, [ ServiceA, ComponentContext, ServiceB ]);
            Test1(
                { value: "x" },
                new ServiceA(),
                { onDispose() {} },
                new ServiceB()
            );
            <Test1 value="x" />;

            // @ts-expect-error Must not compile because service order is wrong.
            component(Test1, [ ServiceB, ComponentContext, ServiceA ]);
            // @ts-expect-error Must not compile because one dependency is missing.
            component(Test1, [ ServiceA, ComponentContext ]);
            // @ts-expect-error Must not compile because the context token does not match ServiceB.
            component(Test1, [ ServiceA, ServiceB, ComponentContext ]);
            // @ts-expect-error Must not compile because the JSX props still come from the first parameter.
            <Test1 />;

            class Test2 {
                public constructor(props: { value: string }, context: ComponentContext, serviceA: ServiceA, serviceB: ServiceB) {
                    void props;
                    void context;
                    void serviceA;
                    void serviceB;
                }

                public render() {
                    return null;
                }
            }
            component(Test2, [ ComponentContext, ServiceA, ServiceB ]);

            // @ts-expect-error Must not compile because ServiceA and ServiceB are swapped.
            component(Test2, [ ComponentContext, ServiceB, ServiceA ]);
            // @ts-expect-error Must not compile because the context token does not match ServiceA.
            component(Test2, [ ServiceA, ComponentContext, ServiceB ]);
            // @ts-expect-error Must not compile because the JSX props still come from the first parameter.
            <Test2 />;
        };
        void dummy;
    });

    it("supports ECMAScript class decorators for class components", () => {
        let disposed = 0;

        @component([ ServiceA, ComponentContext ])
        class HelloWorld {
            readonly #text: string;

            public constructor(props: { name: string }, service: ServiceA, context: ComponentContext) {
                this.#text = `Hello ${props.name} ${service.value}`;
                context.onDispose(() => {
                    disposed++;
                });
            }

            public render() {
                return <h1>{this.#text}</h1>;
            }
        }

        const scope = createScope();
        injector.setClass(ServiceA, { scope });
        try {
            const node = scope.run(() => render(<HelloWorld name="World" />));

            assertInstanceOf(node, HTMLHeadingElement);
            assertSame(node.textContent, "Hello World A");

            dispose(node);

            assertSame(disposed, 1);
        } finally {
            scope.dispose();
        }
    });
});
