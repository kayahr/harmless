/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { describe, it } from "node:test";
import { assertSame } from "@kayahr/assert";
import { Fragment, isJSXNode, jsx, jsxDEV, jsxs } from "../main/jsx.ts";

describe("jsx", () => {
    it("creates node descriptors and defaults null props to an empty object", () => {
        const node = jsx("div", null);

        assertSame(node.type, "div");
        assertSame(typeof node.props, "object");
        assertSame(Object.keys(node.props).length, 0);
    });

    it("normalizes the special JSX key argument into props.key", () => {
        const node = jsx<{ key?: string; title: string }>("div", { title: "test" }, "key");

        assertSame(node.type, "div");
        assertSame(node.props.title, "test");
        assertSame(node.props.key, "key");
    });

    it("normalizes the special JSX key argument even when props are null", () => {
        const node = jsx<{ key?: string }>("div", null, "key");

        assertSame(node.type, "div");
        assertSame(Object.keys(node.props).length, 1);
        assertSame(node.props.key, "key");
    });

    it("exposes jsxs and jsxDEV as aliases of jsx", () => {
        assertSame(jsxs, jsx);
        assertSame(jsxDEV, jsx);
    });

    it("returns fragment children unchanged", () => {
        assertSame(Fragment({ children: "x" }), "x");
        assertSame(Fragment({ children: null }), null);
    });

    it("recognizes JSX node descriptors", () => {
        assertSame(isJSXNode(jsx("div", { children: "x" })), true);
        assertSame(isJSXNode(jsx(Fragment, { children: [] })), true);
        assertSame(isJSXNode({}), false);
        assertSame(isJSXNode({ type: "div" }), false);
        assertSame(isJSXNode({ props: {} }), false);
        assertSame(isJSXNode(null), false);
        assertSame(isJSXNode("div"), false);
    });

});
