/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { escapeRegExp } from "../../main/utils/regexp.js";

describe("escapeRegExp", () => {
    it("escape special characters to be used in regular expression strings", () => {
        expect(escapeRegExp("/")).toBe("\\/");
        expect(escapeRegExp("-")).toBe("\\x2d");
        expect(escapeRegExp("\\")).toBe("\\\\");
        expect(escapeRegExp("^")).toBe("\\^");
        expect(escapeRegExp("$")).toBe("\\$");
        expect(escapeRegExp("*")).toBe("\\*");
        expect(escapeRegExp("+")).toBe("\\+");
        expect(escapeRegExp("?")).toBe("\\?");
        expect(escapeRegExp(".")).toBe("\\.");
        expect(escapeRegExp("(")).toBe("\\(");
        expect(escapeRegExp(")")).toBe("\\)");
        expect(escapeRegExp("|")).toBe("\\|");
        expect(escapeRegExp("[")).toBe("\\[");
        expect(escapeRegExp("]")).toBe("\\]");
        expect(escapeRegExp("{")).toBe("\\{");
        expect(escapeRegExp("}")).toBe("\\}");
    });
    it("uses fallback implementation when `Regexp.escape` not available", () => {
        const oldEscape = RegExp.escape;
        RegExp.escape = undefined;
        try {
            expect(escapeRegExp("/")).toBe("\\/");
            expect(escapeRegExp("-")).toBe("\\x2d");
            expect(escapeRegExp("\\")).toBe("\\\\");
            expect(escapeRegExp("^")).toBe("\\^");
            expect(escapeRegExp("$")).toBe("\\$");
            expect(escapeRegExp("*")).toBe("\\*");
            expect(escapeRegExp("+")).toBe("\\+");
            expect(escapeRegExp("?")).toBe("\\?");
            expect(escapeRegExp(".")).toBe("\\.");
            expect(escapeRegExp("(")).toBe("\\(");
            expect(escapeRegExp(")")).toBe("\\)");
            expect(escapeRegExp("|")).toBe("\\|");
            expect(escapeRegExp("[")).toBe("\\[");
            expect(escapeRegExp("]")).toBe("\\]");
            expect(escapeRegExp("{")).toBe("\\{");
            expect(escapeRegExp("}")).toBe("\\}");
        } finally {
            RegExp.escape = oldEscape;
        }
    });
    it("uses existing `RegExp.escape` if present", () => {
        const oldEscape = RegExp.escape;
        RegExp.escape = (v: string) => `_${v}`;
        try {
            expect(escapeRegExp("/")).toBe("_/");
        } finally {
            RegExp.escape = oldEscape;
        }
    });
});
