/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { render } from "./render.ts";
import { assertSame } from "@kayahr/assert";

describe("fixture", () => {
    describe("fragment", () => {
        it("renders correctly", () => {
            const root = render(<>test {2}</>);
            assertSame(root.innerHTML, "<!--<>-->test 2<!--</>-->");
        });
    });
});
