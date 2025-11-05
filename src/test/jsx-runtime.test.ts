/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */


import { describe, it } from "node:test";

import { Fragment } from "../main/FragmentElement.ts";
import * as exports from "../main/jsx-runtime.ts";
import { jsx, jsxDEV, jsxs } from "../main/jsxFactory.ts";
import type { Element } from "../main/utils/types.ts";
import { assertEquals } from "@kayahr/assert";

describe("jsx-runtime", () => {
    it("exports relevant types and functions and nothing more", () => {
        // Checks if runtime includes the expected exports and nothing else
        assertEquals({ ...exports }, {
            Fragment,
            jsx,
            jsxDEV,
            jsxs
        });

        // Interfaces and types can only be checked by TypeScript
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        ((): Element => (({} as exports.JSX.Element)))();
    });
});
