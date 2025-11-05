/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Context, injectable } from "@kayahr/cdi";
import { describe, it } from "node:test";

import { component } from "../../main/utils/component.ts";
import { render } from "../../main/utils/render.ts";
import type { Element } from "../../main/utils/types.ts";
import { sleep } from "../support.ts";
import { assertDefined, assertSame } from "@kayahr/assert";

class DepA { public a = 1; };
class DepB { public b = 2; };

describe("component", () => {
    it("can decorate a component class for dependency injection", () => {
        @injectable
        class Service {
            public readonly value = 53;
        }

        @component({ inject: [ Service, "name" ] })
        class Component {
            public constructor(
                props: unknown,
                private readonly service: Service,
                private readonly name: string
            ) {}

            public render() {
                return <>{this.service.value} {this.name}</>;
            }
        }

        Context.getActive().setValue("John", "name");

        const root = document.createElement("div");
        root.appendChild(render(<Component />));
        assertSame(root.innerHTML, "<!--<>-->53 John<!--</>-->");
    });

    it("can be used as a function to set class component options", () => {
        @injectable
        class Service {
            public readonly value = 53;
        }

        class Component {
            public constructor(
                props: unknown,
                private readonly service: Service,
                private readonly name: string
            ) {}

            public render() {
                return <>{this.service.value} {this.name}</>;
            }
        }
        component(Component, { inject: [ Service, "name" ] });

        Context.getActive().setValue("John", "name");

        const root = document.createElement("div");
        root.appendChild(render(<Component />));
        assertSame(root.innerHTML, "<!--<>-->53 John<!--</>-->");
    });

    it("can be used as a function to set function component options", () => {
        @injectable
        class Service {
            public readonly value = 53;
        }

        function Component(
            props: unknown,
            service: Service,
            name: string
        ) {
            return <>{service.value} {name}</>;
        }
        component(Component, { inject: [ Service, "name" ] });

        Context.getActive().setValue("John", "name");

        const root = document.createElement("div");
        root.appendChild(render(<Component />));
        assertSame(root.innerHTML, "<!--<>-->53 John<!--</>-->");
    });

    it("can inject async dependencies into function component", async () => {
        class Service {
            public readonly value = 53;
            @injectable
            public static async create(): Promise<Service> {
                await sleep(1);
                return Promise.resolve(new Service());
            }
        }

        function Component(
            props: unknown,
            service: Service,
            name: string
        ) {
            return <>{service.value} {name}</>;
        }
        component(Component, { inject: [ Service, "name" ] });

        Context.getActive().setValue("John", "name");

        const root = document.createElement("div");
        root.appendChild(render(<>:<Component />:</>));
        assertSame(root.innerHTML, "<!--<>-->:<!---->:<!--</>-->");
        await Context.getActive().getAsync(Service);
        await sleep(); // Wait a macro task to give promises time to settle
        assertSame(root.innerHTML, "<!--<>-->:<!--<>-->53 John<!--</>-->:<!--</>-->");
    });

    it("can inject async dependencies into class component", async () => {
        class Service {
            public readonly value = 53;
            @injectable
            public static async create(): Promise<Service> {
                await sleep(1);
                return Promise.resolve(new Service());
            }
        }

        @component({ inject: [ Service, "name" ] })
        class Component {
            public constructor(
                props: unknown,
                public service: Service,
                public name: string
            ) {}

            public render() {
                return <>{this.service.value} {this.name}</>;
            }
        }

        Context.getActive().setValue("John", "name");

        const root = document.createElement("div");
        root.appendChild(render(<>:<Component />:</>));
        assertSame(root.innerHTML, "<!--<>-->:<!---->:<!--</>-->");
        await Context.getActive().getAsync(Service);
        await sleep(); // Wait a macro task to give promises time to settle
        assertSame(root.innerHTML, "<!--<>-->:<!--<>-->53 John<!--</>-->:<!--</>-->");
    });

    it("requires compatible inject array when used as a class decorator", () => {
        // Wrapped into function which is never called because this test is a compiler only test
        const dummy = () => {
            // @ts-expect-error Must not compile because inject array is empty
            @component({ inject: [] })
            class Test1 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because DepB is missing
            @component({ inject: [ DepA ] })
            class Test2 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because dependencies are in wrong order
            @component({ inject: [ DepB, DepA ] })
            class Test3 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because too many dependencies are specified
            @component({ inject: [ DepA, DepB, DepB ] })
            class Test4 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because inject option is missing
            @component({})
            class Test5 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because component options are required
            @component()
            class Test6 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because decorator arguments are required
            @component
            class Test7 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because null inject is not allowed
            @component({ inject: [ null, DepB ] })
            class Test8 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because properties parameter must not be specified
            @component({ inject: [ "props", DepA, DepB ] })
            class Test9 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }

            // Dummy line to silence "defined but not used" warnings
            assertDefined([ Test1, Test2, Test3, Test4, Test5, Test6, Test7, Test8, Test9 ]);
        };

        // Dummy line to silence unused warning
        assertDefined(dummy);
    });

    it("requires compatible component class when used as a class decorator", () => {
        // Wrapped into function which is never called because this test is a compiler only test
        const dummy = () => {
            // @ts-expect-error Must not compile because class is not a JSX element class (render method missing)
            @component({ inject: [ DepA, DepB ] })
            class Test1 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
            }
            // @ts-expect-error Must not compile because class is not a JSX element class (render method incompatible)
            @component({ inject: [ DepA, DepB ] })
            class Test2 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): void {}
            }

            // Dummy line to silence "defined but not used" warnings
            assertDefined([ Test1, Test2 ]);
        };

        // Dummy line to silence unused warning
        assertDefined(dummy);
    });

    it("requires compatible inject array when used as a function to register a class component", () => {
        // Wrapped into function which is never called because this test is a compiler only test
        const dummy = () => {
            class Test1 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because inject array is empty
            component(Test1, { inject: [] });

            class Test2 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because DepB is missing
            component(Test2, { inject: [ DepA ] });

            class Test3 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because dependencies are in wrong order
            component(Test3, { inject: [ DepB, DepA ] });

            class Test4 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because too many dependencies are specified
            component(Test4, { inject: [ DepA, DepB, DepB ] });

            class Test5 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because inject option is missing
            component(Test5, {});

            class Test6 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because component options are required
            component(Test6);

            class Test7 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because null inject is not allowed
            component(Test7, { inject: [ null, DepB ] });

            class Test8 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): Element { return <></>; }
            }
            // @ts-expect-error Must not compile because properties parameter must not be specified
            component(Test8, { inject: [ "props", DepA, DepB ] });

            // Dummy line to silence "defined but not used" warnings
            assertDefined([ Test1, Test2, Test3, Test4, Test5, Test6, Test7, Test8 ]);
        };

        // Dummy line to silence unused warning
        assertDefined(dummy);
    });

    it("requires compatible component class when used as a function to register a class component", () => {
        // Wrapped into function which is never called because this test is a compiler only test
        const dummy = () => {
            class Test1 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
            }
            // @ts-expect-error Must not compile because class is not a JSX element class (render method missing)
            component(Test1, { inject: [ DepA, DepB ] });

            class Test2 {
                public constructor(public props: unknown, public a: DepA, public b: DepB) {}
                public render(): void {}
            }
            // @ts-expect-error Must not compile because class is not a JSX element class (render method incompatible)
            component(Test2, { inject: [ DepA, DepB ] });

            // Dummy line to silence "defined but not used" warnings
            assertDefined([ Test1, Test2 ]);
        };

        // Dummy line to silence unused warning
        assertDefined(dummy);
    });

    it("requires compatible inject array when used to register a function component", () => {
        // Wrapped into function which is never called because this test is a compiler only test
        const dummy = () => {
            function Test1(props: unknown, a: DepA, b: DepB) {
                return <></>;
            }
            // @ts-expect-error Must not compile because inject array is empty
            component(Test1, { inject: [] });

            function Test2(props: unknown, a: DepA, b: DepB) {
                return <></>;
            }
            // @ts-expect-error Must not compile because DepB is missing
            component(Test2, { inject: [ DepA ] });

            function Test3(props: unknown, a: DepA, b: DepB) {
                return <></>;
            }
            // @ts-expect-error Must not compile because dependencies are in wrong order
            component(Test3, { inject: [ DepB, DepA ] });

            function Test4(props: unknown, a: DepA, b: DepB) {
                return <></>;
            }
            // @ts-expect-error Must not compile because too many dependencies are specified
            component(Test4, { inject: [ DepA, DepB, DepB ] });

            function Test5(props: unknown, a: DepA, b: DepB) {
                return <></>;
            }
            // @ts-expect-error Must not compile because inject option is missing
            component(Test5, {});

            function Test6(props: unknown, a: DepA, b: DepB) {
                return <></>;
            }
            // @ts-expect-error Must not compile because component options are required
            component(Test6);

            function Test7(props: unknown, a: DepA, b: DepB) {
                return <></>;
            }
            // @ts-expect-error Must not compile because null inject is not allowed
            component(Test7, { inject: [ null, DepB ] });

            function Test8(props: unknown, a: DepA, b: DepB) {
                return <></>;
            }
            // @ts-expect-error Must not compile because properties parameter must not be specified
            component(Test8, { inject: [ "props", DepA, DepB ] });

            // Dummy line to silence "defined but not used" warnings
            assertDefined([ Test1, Test2, Test3, Test4, Test5, Test6, Test7, Test8 ]);
        };

        // Dummy line to silence unused warning
        assertDefined(dummy);
    });

    it("requires compatible component function when used as to register a function component", () => {
        // Wrapped into function which is never called because this test is a compiler only test
        const dummy = () => {
            function Test1(props: unknown, a: DepA, b: DepB) {
                return "test";
            }

            // Dummy line to silence "defined but not used" warnings
            assertDefined([ Test1 ]);
        };

        // Dummy line to silence unused warning
        assertDefined(dummy);
    });
});
