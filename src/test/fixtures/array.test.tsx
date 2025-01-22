/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { render } from "./render.js";

describe("fixture", () => {
    describe("array", () => {
        it("renders correctly", () => {
            const root = render(<div>{[ 1, " ", 3, ":", false, ":", null, [ "!", "!!" ] ]}</div>);
            expect(root.innerHTML).toBe("<div>1 3:false:!!!</div>");
        });
    });
});
