/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { escapeRegExp } from "../../main/utils/regexp.ts";
import { assertSame } from "@kayahr/assert";

describe("escapeRegExp", () => {
    it("escape special characters to be used in regular expression strings", () => {
        assertSame(escapeRegExp("/"), "\\/");
        assertSame(escapeRegExp("-"), "\\x2d");
        assertSame(escapeRegExp("\\"), "\\\\");
        assertSame(escapeRegExp("^"), "\\^");
        assertSame(escapeRegExp("$"), "\\$");
        assertSame(escapeRegExp("*"), "\\*");
        assertSame(escapeRegExp("+"), "\\+");
        assertSame(escapeRegExp("?"), "\\?");
        assertSame(escapeRegExp("."), "\\.");
        assertSame(escapeRegExp("("), "\\(");
        assertSame(escapeRegExp(")"), "\\)");
        assertSame(escapeRegExp("|"), "\\|");
        assertSame(escapeRegExp("["), "\\[");
        assertSame(escapeRegExp("]"), "\\]");
        assertSame(escapeRegExp("{"), "\\{");
        assertSame(escapeRegExp("}"), "\\}");
    });
    it("uses fallback implementation when `Regexp.escape` not available", () => {
        const oldEscape = RegExp.escape;
        RegExp.escape = undefined;
        try {
            assertSame(escapeRegExp("/"), "\\/");
            assertSame(escapeRegExp("-"), "\\x2d");
            assertSame(escapeRegExp("\\"), "\\\\");
            assertSame(escapeRegExp("^"), "\\^");
            assertSame(escapeRegExp("$"), "\\$");
            assertSame(escapeRegExp("*"), "\\*");
            assertSame(escapeRegExp("+"), "\\+");
            assertSame(escapeRegExp("?"), "\\?");
            assertSame(escapeRegExp("."), "\\.");
            assertSame(escapeRegExp("("), "\\(");
            assertSame(escapeRegExp(")"), "\\)");
            assertSame(escapeRegExp("|"), "\\|");
            assertSame(escapeRegExp("["), "\\[");
            assertSame(escapeRegExp("]"), "\\]");
            assertSame(escapeRegExp("{"), "\\{");
            assertSame(escapeRegExp("}"), "\\}");
        } finally {
            RegExp.escape = oldEscape;
        }
    });
    it("uses existing `RegExp.escape` if present", () => {
        const oldEscape = RegExp.escape;
        RegExp.escape = (v: string) => `_${v}`;
        try {
            assertSame(escapeRegExp("/"), "_/");
        } finally {
            RegExp.escape = oldEscape;
        }
    });
});
