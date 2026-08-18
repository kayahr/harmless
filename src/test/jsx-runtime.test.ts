/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { describe, it } from "node:test";
import { assertSame } from "@kayahr/assert";
import { Fragment as runtimeFragment, jsx as runtimeJsx, jsxDEV as runtimeJsxDEV, jsxs as runtimeJsxs } from "../main/jsx-runtime.ts";
import { Fragment, isJSXNode, jsx } from "../main/jsx.ts";

describe("jsx-runtime", () => {
    it("re-exports the runtime helpers from jsx", () => {
        assertSame(runtimeFragment, Fragment);
        assertSame(runtimeJsx, jsx);
        assertSame(runtimeJsxs, jsx);
        assertSame(runtimeJsxDEV, jsx);
    });

    it("covers the source jsx helpers used by the runtime facade", () => {
        const emptyNode = jsx("div", null);
        const keyedNode = jsx<{ key?: string; title: string }>("div", { title: "test" }, "key");
        const keyedNullPropsNode = jsx<{ key?: string }>("div", null, "key");

        assertSame(emptyNode.type, "div");
        assertSame(typeof emptyNode.props, "object");
        assertSame(Object.keys(emptyNode.props).length, 0);

        assertSame(keyedNode.type, "div");
        assertSame(keyedNode.props.title, "test");
        assertSame(keyedNode.props.key, "key");

        assertSame(keyedNullPropsNode.type, "div");
        assertSame(Object.keys(keyedNullPropsNode.props).length, 1);
        assertSame(keyedNullPropsNode.props.key, "key");

        assertSame(Fragment({ children: "x" }), "x");
        assertSame(Fragment({ children: null }), null);

        assertSame(isJSXNode(jsx("div", { children: "x" })), true);
        assertSame(isJSXNode(jsx(Fragment, { children: [] })), true);
        assertSame(isJSXNode({}), false);
        assertSame(isJSXNode({ type: "div" }), false);
        assertSame(isJSXNode({ props: {} }), false);
        assertSame(isJSXNode(null), false);
        assertSame(isJSXNode("div"), false);
    });
});
