/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it, vi } from "vitest";

import type { JSXElement } from "../../main/JSXElement.js";
import { onDestroy } from "../../main/utils/lifecycle.js";

describe("fixture", () => {
    describe("destroy", () => {
        it("destroys a component after it has been rendered", () => {
            const destroyed = vi.fn();
            const Component = () => {
                onDestroy(destroyed);
                return <div>test</div>;
            };
            const component = <Component /> as JSXElement;
            component.destroy();
            component.createNode();
            expect(destroyed).not.toHaveBeenCalled();
            component.destroy();
            expect(destroyed).toHaveBeenCalledOnce();
        });
    });
});
