/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { ClassComponent } from "../main/ClassComponent.ts";
import { FunctionComponent } from "../main/FunctionComponent.ts";
import { IntrinsicElement } from "../main/IntrinsicElement.ts";
import { jsx, jsxDEV, jsxs } from "../main/jsxFactory.ts";
import { render } from "../main/utils/render.ts";
import type { Element } from "../main/utils/types.ts";
import { assertInstanceOf, assertSame } from "@kayahr/assert";

describe("jsx", () => {
    it("returns an intrinsic element when source is a string", () => {
        const element = jsx("div", {});
        assertInstanceOf(element, IntrinsicElement);
    });
    it("passes properties to intrinsic element", () => {
        const element = jsx("div", { id: 123, class: "test" });
        assertInstanceOf(element, IntrinsicElement);
        assertSame((render(element) as HTMLElement).outerHTML, '<div id="123" class="test"></div>');
    });
    it("passes key property to intrinsic element", () => {
        const element = jsx("div", {}, "foo");
        assertInstanceOf(element, IntrinsicElement);
        assertSame((render(element) as HTMLElement).outerHTML, '<div key="foo"></div>');
    });
    it("passes children to intrinsic element", () => {
        const element = jsx("div", { children: [ 1, " ", true ] });
        assertInstanceOf(element, IntrinsicElement);
        assertSame((render(element) as HTMLElement).outerHTML, "<div>1 true</div>");
    });
    it("passe single child to intrinsic element", () => {
        const element = jsx("div", { children: "bar" });
        assertInstanceOf(element, IntrinsicElement);
        assertSame((render(element) as HTMLElement).outerHTML, "<div>bar</div>");
    });
    it("returns a function element when source is a factory function", () => {
        const Component = () => <span />;
        const element = jsx(Component, {});
        assertInstanceOf(element, FunctionComponent);
        assertSame((render(element) as HTMLElement).outerHTML, "<span></span>");
    });
    it("passes properties to function element", () => {
        const Component = ({ id, children }: { id: string, children: unknown }) => <div id={id}>{children}</div>;
        const element = jsx(Component, { id: "test", children: [ true, " ", false ] });
        assertInstanceOf(element, FunctionComponent);
        assertSame((render(element) as HTMLElement).outerHTML, '<div id="test">true false</div>');
    });
    it("passes key property as property to function element", () => {
        const Component = ({ key, id }: { id: string, key: number }) => <div id={id}>{key}</div>;
        const element = jsx(Component, { id: "foo" }, 123);
        assertInstanceOf(element, FunctionComponent);
        assertSame((render(element) as HTMLElement).outerHTML, '<div id="foo">123</div>');
    });
    it("returns a class element when source is a class", () => {
        class Component {
            public render(): Element {
                return <span />;
            }
        }
        const element = jsx(Component, {});
        assertInstanceOf(element, ClassComponent);
        assertSame((render(element) as HTMLElement).outerHTML, "<span></span>");
    });
    it("passes properties to class element", () => {
        class Component {
            readonly #id: string;
            readonly #children: unknown;

            public constructor({ id, children }: { id: string, children: unknown }) {
                this.#id = id;
                this.#children = children;
            }

            public render(): Element {
                return <div id={this.#id}>{this.#children}</div>;
            }
        }
        const element = jsx(Component, { id: "test", children: [ true, " ", false ] });
        assertInstanceOf(element, ClassComponent);
        assertSame((render(element) as HTMLElement).outerHTML, '<div id="test">true false</div>');
    });
    it("passes key property as property to function element", () => {
        class Component {
            readonly #id: string;
            readonly #key: number;

            public constructor({ id, key }: { id: string, key: number }) {
                this.#id = id;
                this.#key = key;
            }

            public render(): Element {
                return <div id={this.#id}>{this.#key}</div>;
            }
        }
        const element = jsx(Component, { id: "foo" }, 123);
        assertInstanceOf(element, ClassComponent);
        assertSame((render(element) as HTMLElement).outerHTML, '<div id="foo">123</div>');
    });
});

describe("jsxs", () => {
    it("is just an alias for jsx", () => {
        assertSame(jsxs, jsx);
    });
});

describe("jsxDEV", () => {
    it("is just an alias for jsx", () => {
        assertSame(jsxDEV, jsx);
    });
});
