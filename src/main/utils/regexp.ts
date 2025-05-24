/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

declare global {
    interface RegExpConstructor {
        escape?(s: string): string;
    }
}

/**
 * Escapes the given string so it can be safely used within a regular expression.
 *
 * This calls `RegExp.escape` if present or otherwise uses a very simple (and most likely incomplete) conversion
 * found here: https://stackoverflow.com/a/3561711
 * If this fallback is not good enough then users can decide to use a full-featured `RegExp.escape` polyfill like the one in core-js.
 *
 * This function can be removed and replaced with `RegExp.escape` when all major browsers supports it.
 *
 * @param s - The string to escape
 * @returns The escaped string.
 */
export function escapeRegExp(s: string): string {
    return RegExp.escape?.(s) ?? s.replace(/[-/\\^$*+?.()|[\]{}]/g, (a, b) => `\\${a === "-" ? "x2d" : a}`);
}
