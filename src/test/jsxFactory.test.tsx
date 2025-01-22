/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { ClassComponent } from "../main/ClassComponent.js";
import { FunctionComponent } from "../main/FunctionComponent.js";
import { IntrinsicElement } from "../main/IntrinsicElement.js";
import { jsx, jsxDEV, jsxs } from "../main/jsxFactory.js";
import { render } from "../main/utils/render.js";
import type { Element } from "../main/utils/types.js";

describe("jsx", () => {
    it("returns an intrinsic element when source is a string", () => {
        const element = jsx("div", {});
        expect(element).toBeInstanceOf(IntrinsicElement);
    });
    it("passes properties to intrinsic element", () => {
        const element = jsx("div", { id: 123, class: "test" });
        expect(element).toBeInstanceOf(IntrinsicElement);
        expect((render(element) as HTMLElement).outerHTML).toBe('<div id="123" class="test"></div>');
    });
    it("passes key property to intrinsic element", () => {
        const element = jsx("div", {}, "foo");
        expect(element).toBeInstanceOf(IntrinsicElement);
        expect((render(element) as HTMLElement).outerHTML).toBe('<div key="foo"></div>');
    });
    it("passes children to intrinsic element", () => {
        const element = jsx("div", { children: [ 1, " ", true ] });
        expect(element).toBeInstanceOf(IntrinsicElement);
        expect((render(element) as HTMLElement).outerHTML).toBe("<div>1 true</div>");
    });
    it("passe single child to intrinsic element", () => {
        const element = jsx("div", { children: "bar" });
        expect(element).toBeInstanceOf(IntrinsicElement);
        expect((render(element) as HTMLElement).outerHTML).toBe("<div>bar</div>");
    });
    it("returns a function element when source is a factory function", () => {
        const Component = () => <span />;
        const element = jsx(Component, {});
        expect(element).toBeInstanceOf(FunctionComponent);
        expect((render(element) as HTMLElement).outerHTML).toBe("<span></span>");
    });
    it("passes properties to function element", () => {
        const Component = ({ id, children }: { id: string, children: unknown }) => <div id={id}>{children}</div>;
        const element = jsx(Component, { id: "test", children: [ true, " ", false ] });
        expect(element).toBeInstanceOf(FunctionComponent);
        expect((render(element) as HTMLElement).outerHTML).toBe('<div id="test">true false</div>');
    });
    it("passes key property as property to function element", () => {
        const Component = ({ key, id }: { id: string, key: number }) => <div id={id}>{key}</div>;
        const element = jsx(Component, { id: "foo" }, 123);
        expect(element).toBeInstanceOf(FunctionComponent);
        expect((render(element) as HTMLElement).outerHTML).toBe('<div id="foo">123</div>');
    });
    it("returns a class element when source is a class", () => {
        class Component {
            public render(): Element {
                return <span />;
            }
        }
        const element = jsx(Component, {});
        expect(element).toBeInstanceOf(ClassComponent);
        expect((render(element) as HTMLElement).outerHTML).toBe("<span></span>");
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
        expect(element).toBeInstanceOf(ClassComponent);
        expect((render(element) as HTMLElement).outerHTML).toBe('<div id="test">true false</div>');
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
        expect(element).toBeInstanceOf(ClassComponent);
        expect((render(element) as HTMLElement).outerHTML).toBe('<div id="foo">123</div>');
    });
});

describe("jsxs", () => {
    it("is just an alias for jsx", () => {
        expect(jsxs).toBe(jsx);
    });
});

describe("jsxDEV", () => {
    it("is just an alias for jsx", () => {
        expect(jsxDEV).toBe(jsx);
    });
});
