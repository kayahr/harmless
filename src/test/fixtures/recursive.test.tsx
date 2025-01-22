/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Observable } from "@kayahr/observable";
import { describe, expect, it } from "vitest";

import { render } from "./render.js";

describe("fixture", () => {
    describe("recursive children", () => {
        it("renders correctly", async () => {
            let next = (value: number | null) => {};
            const observable = new Observable<number | null>(observer => { next = v => observer.next(v); observer.next(-1); });
            const promise = new Promise(resolve => setTimeout(() => resolve(observable), 0));
            const root = render(<>{[ "Value: ", [ () => promise ] ]}</>);
            expect(root.innerHTML).toBe("Value: ");
            next(1);
            expect(root.innerHTML).toBe("Value: ");
            await promise;
            expect(root.innerHTML).toBe("Value: -1");
            next(2);
            expect(root.innerHTML).toBe("Value: 2");
            next(3);
            expect(root.innerHTML).toBe("Value: 3");
            next(null);
            expect(root.innerHTML).toBe("Value: ");
        });
    });
    describe("recursive attributes", () => {
        it("renders correctly", async () => {
            let next = (value: number | null) => {};
            const observable = new Observable<number | null>(observer => { next = v => observer.next(v); observer.next(-1); });
            const promise = new Promise(resolve => setTimeout(() => resolve(observable), 0));
            const root = render(<input value={() => promise} />);
            expect(root.innerHTML).toBe("<input>");
            next(1);
            expect(root.innerHTML).toBe("<input>");
            await promise;
            expect(root.innerHTML).toBe('<input value="-1">');
            next(2);
            expect(root.innerHTML).toBe('<input value="2">');
            next(3);
            expect(root.innerHTML).toBe('<input value="3">');
            next(null);
            expect(root.innerHTML).toBe("<input>");
        });
    });
});
