/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { render } from "./render.ts";
import { assertSame } from "@kayahr/assert";

describe("fixture", () => {
    describe("primitives", () => {
        it("renders primitive children correctly", () => {
            const root = render(
                <div>
                  <span id="string">Test</span>
                  <span id="numbers">{123} {-23} {13.45} {-42.01} {Infinity} {-Infinity} {NaN} {-0} {+0}</span>
                  <span id="booleans">{true} {false}</span>
                  <span id="null">{null}</span>
                  <span id="undefined">{undefined}</span>
                </div>
            );
            assertSame(root.innerHTML, "<div>"
                + '<span id="string">Test</span>'
                + '<span id="numbers">123 -23 13.45 -42.01 Infinity -Infinity NaN 0 0</span>'
                + '<span id="booleans">true false</span>'
                + '<span id="null"></span>'
                + '<span id="undefined"></span>'
                + "</div>");
        });
        it("renders primitive attributes correctly", () => {
            const root = render(
                <>
                  <input id="string" value="string" />
                  <input id="number" value={123} />
                  <input id="true" value={true} />
                  <input id="false" value={false} />
                  <input id="null" value={null} />
                  <input id="undefined" value={undefined} />
                </>
            );
            assertSame(root.innerHTML, "<!--<>-->"
                + '<input id="string" value="string">'
                + '<input id="number" value="123">'
                + '<input id="true" value="">'
                + '<input id="false">'
                + '<input id="null">'
                + '<input id="undefined">'
                + "<!--</>-->");
        });
    });
});
