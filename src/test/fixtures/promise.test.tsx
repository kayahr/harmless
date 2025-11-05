/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { render } from "./render.ts";
import { assertSame } from "@kayahr/assert";

describe("fixture", () => {
    describe("promise", () => {
        it("renders correctly as child", async () => {
            const promise = new Promise(resolve => setTimeout(() => resolve(53), 0));
            const root = render(<>Value: {promise}</>);
            assertSame(root.innerHTML, "<!--<>-->Value: <!----><!--</>-->");
            await promise;
            assertSame(root.innerHTML, "<!--<>-->Value: 53<!--</>-->");
        });
        it("renders correctly as attribute", async () => {
            const promise = new Promise(resolve => setTimeout(() => resolve(53), 0));
            const root = render(<input value={promise} />);
            assertSame(root.innerHTML, "<input>");
            await promise;
            assertSame(root.innerHTML, '<input value="53">');
        });
    });
});
