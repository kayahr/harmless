/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { SignalScope } from "@kayahr/signal";
import { describe, expect, it, vi } from "vitest";

import { onDestroy } from "../../main/utils/lifecycle.js";

describe("onDestroy", () => {
    it("does nothing when no scope exists", () => {
        expect(() => onDestroy(() => { throw Error("!"); })).not.toThrow();
    });
    it("registers a destroy handler on the current scope", () => {
        const scope = new SignalScope().activate();
        const handler = vi.fn();
        onDestroy(handler);
        expect(handler).not.toHaveBeenCalled();
        scope.destroy();
        expect(handler).toHaveBeenCalledOnce();
    });
});
