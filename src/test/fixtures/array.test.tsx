/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { render } from "./render.ts";
import { assertSame } from "@kayahr/assert";

describe("fixture", () => {
    describe("array", () => {
        it("renders correctly", () => {
            const root = render(<div>{[ 1, " ", 3, ":", false, ":", null, [ "!", "!!" ] ]}</div>);
            assertSame(root.innerHTML, "<div>1 3:false:<!--<>-->!!!<!--</>--></div>");
        });
    });
});
