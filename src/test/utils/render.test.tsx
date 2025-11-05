/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { render } from "../../main/utils/render.ts";
import { sleep } from "../support.ts";
import { assertInstanceOf, assertSame } from "@kayahr/assert";

describe("render", () => {
    it("renders a function element to a DOM node", () => {
        function Component() {
            return <h1>test</h1>;
        }
        const node = render(<Component />) as HTMLElement;
        assertInstanceOf(node, HTMLHeadingElement);
        assertSame(node.outerHTML, "<h1>test</h1>");
    });
    it("renders a class element to a DOM node", () => {
        class Component {
            public render() {
                return <h1>test</h1>;
            }
        }
        const node = render(<Component />) as HTMLElement;
        assertInstanceOf(node, HTMLHeadingElement);
        assertSame(node.outerHTML, "<h1>test</h1>");
    });
    it("renders a string to a DOM node", () => {
        const node = render("test") as Text;
        assertInstanceOf(node, Text);
        assertSame(node.textContent, "test");
    });
    it("renders an async string to a DOM node", async () => {
        const test = Promise.resolve("test");
        const root = document.createElement("body");
        const node = render(test);
        root.appendChild(node);
        assertInstanceOf(node, Comment);
        assertSame(node.textContent, "");
        await sleep();
        assertSame(root.innerHTML, "test");
    });
});
