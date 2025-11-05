/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import type { JSXElement } from "../../main/JSXElement.ts";
import { onDestroy } from "../../main/utils/lifecycle.ts";
import { assertSame } from "@kayahr/assert";

describe("fixture", () => {
    describe("destroy", () => {
        it("destroys a component after it has been rendered", (context) => {
            const destroyed = context.mock.fn();
            const Component = () => {
                onDestroy(destroyed);
                return <div>test</div>;
            };
            const component = <Component /> as JSXElement;
            component.destroy();
            component.createNode();
            assertSame(destroyed.mock.callCount(), 0);
            component.destroy();
            assertSame(destroyed.mock.callCount(), 1);
        });
    });
});
