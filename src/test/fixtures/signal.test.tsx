/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { signal } from "@kayahr/signal";
import { describe, expect, it } from "vitest";

import { render } from "./render.js";

describe("fixture", () => {
    describe("signal", () => {
        it("renders correctly as child", () => {
            const value = signal(1);
            const root = render(<>Value: {value}</>);
            expect(root.innerHTML).toBe("<!--<>-->Value: 1<!--</>-->");
            value.set(2);
            expect(root.innerHTML).toBe("<!--<>-->Value: 2<!--</>-->");
        });
        it("renders correctly as attribute", () => {
            const value = signal(1);
            const root = render(<input value={value} />);
            expect(root.innerHTML).toBe('<input value="1">');
            value.set(2);
            expect(root.innerHTML).toBe('<input value="2">');
        });
    });
});
