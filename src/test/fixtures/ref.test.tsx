/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { ref } from "../../main/utils/Reference.ts";
import { render } from "./render.ts";
import { assertSame } from "@kayahr/assert";

describe("fixture", () => {
    describe("ref", () => {
        it("can move reference to other place", () => {
            const spanRef = ref();
            const root = render(<>
                <h1><span ref={spanRef}>Text</span></h1>
                <h2>{spanRef}</h2>
            </>);
            assertSame(root.innerHTML, "<!--<>--><h1></h1><h2><span>Text</span></h2><!--</>-->");
        });
    });
});
