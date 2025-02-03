/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { ref } from "../../main/utils/Reference.js";
import { render } from "./render.js";

describe("fixture", () => {
    describe("ref", () => {
        it("can move reference to other place", () => {
            const spanRef = ref();
            const root = render(<>
                <h1><span ref={spanRef}>Text</span></h1>
                <h2>{spanRef}</h2>
            </>);
            expect(root.innerHTML).toBe("<!--<>--><h1></h1><h2><span>Text</span></h2><!--</>-->");
        });
    });
});
