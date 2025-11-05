/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Observable } from "@kayahr/observable";
import { describe, it } from "node:test";

import { render } from "./render.ts";
import { assertSame } from "@kayahr/assert";

describe("fixture", () => {
    describe("recursive children", () => {
        it("renders correctly", async () => {
            let next = (value: number | null) => {};
            const observable = new Observable<number | null>(observer => { next = v => observer.next(v); observer.next(-1); });
            const promise = new Promise(resolve => setTimeout(() => resolve(observable), 0));
            const root = render(<>{[ "Value: ", [ () => promise ] ]}</>);
            assertSame(root.innerHTML, "<!--<>-->Value: <!--<>--><!----><!--</>--><!--</>-->");
            next(1);
            assertSame(root.innerHTML, "<!--<>-->Value: <!--<>--><!----><!--</>--><!--</>-->");
            await promise;
            assertSame(root.innerHTML, "<!--<>-->Value: <!--<>-->-1<!--</>--><!--</>-->");
            next(2);
            assertSame(root.innerHTML, "<!--<>-->Value: <!--<>-->2<!--</>--><!--</>-->");
            next(3);
            assertSame(root.innerHTML, "<!--<>-->Value: <!--<>-->3<!--</>--><!--</>-->");
            next(null);
            assertSame(root.innerHTML, "<!--<>-->Value: <!--<>--><!--</>--><!--</>-->");
        });
    });
    describe("recursive attributes", () => {
        it("renders correctly", async () => {
            let next = (value: number | null) => {};
            const observable = new Observable<number | null>(observer => { next = v => observer.next(v); observer.next(-1); });
            const promise = new Promise(resolve => setTimeout(() => resolve(observable), 0));
            const root = render(<input value={() => promise} />);
            assertSame(root.innerHTML, "<input>");
            next(1);
            assertSame(root.innerHTML, "<input>");
            await promise;
            assertSame(root.innerHTML, '<input value="-1">');
            next(2);
            assertSame(root.innerHTML, '<input value="2">');
            next(3);
            assertSame(root.innerHTML, '<input value="3">');
            next(null);
            assertSame(root.innerHTML, "<input>");
        });
    });
});
