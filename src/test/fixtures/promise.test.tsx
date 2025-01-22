/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { render } from "./render.js";

describe("fixture", () => {
    describe("promise", () => {
        it("renders correctly as child", async () => {
            const promise = new Promise(resolve => setTimeout(() => resolve(53), 0));
            const root = render(<>Value: {promise}</>);
            expect(root.innerHTML).toBe("Value: ");
            await promise;
            expect(root.innerHTML).toBe("Value: 53");
        });
        it("renders correctly as attribute", async () => {
            const promise = new Promise(resolve => setTimeout(() => resolve(53), 0));
            const root = render(<input value={promise} />);
            expect(root.innerHTML).toBe("<input>");
            await promise;
            expect(root.innerHTML).toBe('<input value="53">');
        });
    });
});
