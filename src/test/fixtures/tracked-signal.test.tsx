/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { signal } from "@kayahr/signal";
import { describe, it } from "node:test";

import { render } from "./render.ts";
import { assertSame } from "@kayahr/assert";

describe("fixture", () => {
    describe("tracked signal", () => {
        it("renders correctly as child", () => {
            const value = signal(1);
            const root = render(<>Value: {() => value.get() * 2}</>);
            assertSame(root.innerHTML, "<!--<>-->Value: 2<!--</>-->");
            value.set(2);
            assertSame(root.innerHTML, "<!--<>-->Value: 4<!--</>-->");
        });
        it("renders correctly as attribute", () => {
            const value = signal(1);
            const root = render(<input value={() => value.get() * 2} />);
            assertSame(root.innerHTML, '<input value="2">');
            value.set(2);
            assertSame(root.innerHTML, '<input value="4">');
        });
    });
});
