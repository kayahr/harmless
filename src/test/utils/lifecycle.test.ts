/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { Context } from "../../main/Context.ts";
import { onDestroy } from "../../main/utils/lifecycle.ts";
import { assertNotThrow, assertSame } from "@kayahr/assert";

describe("onDestroy", () => {
    it("does nothing when no scope exists", () => {
        assertNotThrow(() => onDestroy(() => { throw new Error("!"); }), );
    });
    it("registers a destroy handler on the current scope", (context) => {
        const scope = new Context();
        const handler = scope.runInContext(() => {
            const handler = context.mock.fn();
            onDestroy(handler);
            return handler;
        });
        assertSame(handler.mock.callCount(), 0);
        scope.destroy();
        assertSame(handler.mock.callCount(), 1);
    });
});
