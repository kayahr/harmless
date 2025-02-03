/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { render } from "./render.js";

describe("fixture", () => {
    describe("fragment", () => {
        it("renders correctly", () => {
            const root = render(<>test {2}</>);
            expect(root.innerHTML).toBe("<!--<>-->test 2<!--</>-->");
        });
    });
});
