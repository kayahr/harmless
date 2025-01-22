/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import "@kayahr/vitest-matchers";

import { describe, expect, it } from "vitest";

import { Fragment } from "../main/FragmentElement.js";
import * as exports from "../main/jsx-runtime.js";
import { jsx, jsxDEV, jsxs } from "../main/jsxFactory.js";
import type { Element } from "../main/utils/types.js";

describe("jsx-runtime", () => {
    it("exports relevant types and functions and nothing more", () => {
        // Checks if runtime includes the expected exports and nothing else
        expect({ ...exports }).toEqual({
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
