/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { render } from "../../main/utils/render.js";
import { sleep } from "../support.js";

describe("render", () => {
    it("renders a function element to a DOM node", () => {
        function Component() {
            return <h1>test</h1>;
        }
        const node = render(<Component />) as HTMLElement;
        expect(node).toBeInstanceOf(HTMLHeadingElement);
        expect(node.outerHTML).toBe("<h1>test</h1>");
    });
    it("renders a class element to a DOM node", () => {
        class Component {
            public render() {
                return <h1>test</h1>;
            }
        }
        const node = render(<Component />) as HTMLElement;
        expect(node).toBeInstanceOf(HTMLHeadingElement);
        expect(node.outerHTML).toBe("<h1>test</h1>");
    });
    it("renders a string to a DOM node", () => {
        const node = render("test") as Text;
        expect(node).toBeInstanceOf(Text);
        expect(node.textContent).toBe("test");
    });
    it("renders an async string to a DOM node", async () => {
        const test = Promise.resolve("test");
        const root = document.createElement("body");
        const node = render(test);
        root.appendChild(node);
        expect(node).toBeInstanceOf(Text);
        expect(node.textContent).toBe("");
        await sleep();
        expect(root.innerHTML).toBe("test");
    });
});
