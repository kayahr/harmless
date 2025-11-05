/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Observable } from "@kayahr/observable";
import { describe, it } from "node:test";

import { render } from "./render.ts";
import { assertSame } from "@kayahr/assert";

describe("fixture", () => {
    describe("observable", () => {
        it("renders correctly as child", () => {
            let next = (value: number) => {};
            const observable = new Observable<number>(observer => { next = v => observer.next(v); });
            const root = render(<>Value: {observable}</>);
            assertSame(root.innerHTML, "<!--<>-->Value: <!----><!--</>-->");
            next(1);
            assertSame(root.innerHTML, "<!--<>-->Value: 1<!--</>-->");
            next(2);
            assertSame(root.innerHTML, "<!--<>-->Value: 2<!--</>-->");
        });
        it("renders correctly as attribute", () => {
            let next = (value: number) => {};
            const observable = new Observable<number>(observer => { next = v => observer.next(v); });
            const root = render(<input value={observable} />);
            assertSame(root.innerHTML, "<input>");
            next(1);
            assertSame(root.innerHTML, '<input value="1">');
            next(2);
            assertSame(root.innerHTML, '<input value="2">');
        });
    });
});
