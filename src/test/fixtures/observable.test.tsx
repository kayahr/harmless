/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Observable } from "@kayahr/observable";
import { describe, expect, it } from "vitest";

import { render } from "./render.js";

describe("fixture", () => {
    describe("observable", () => {
        it("renders correctly as child", () => {
            let next = (value: number) => {};
            const observable = new Observable<number>(observer => { next = v => observer.next(v); });
            const root = render(<>Value: {observable}</>);
            expect(root.innerHTML).toBe("Value: ");
            next(1);
            expect(root.innerHTML).toBe("Value: 1");
            next(2);
            expect(root.innerHTML).toBe("Value: 2");
        });
        it("renders correctly as attribute", () => {
            let next = (value: number) => {};
            const observable = new Observable<number>(observer => { next = v => observer.next(v); });
            const root = render(<input value={observable} />);
            expect(root.innerHTML).toBe("<input>");
            next(1);
            expect(root.innerHTML).toBe('<input value="1">');
            next(2);
            expect(root.innerHTML).toBe('<input value="2">');
        });
    });
});
