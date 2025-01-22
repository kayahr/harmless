/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Observable } from "@kayahr/observable";
import { signal } from "@kayahr/signal";
import { describe, expect, it, vi } from "vitest";

import { render } from "./render.js";

describe("fixture", () => {
    describe("event", () => {
        it("can be registered statically", () => {
            const handler = vi.fn();
            const root = render(<button id="btn" onclick={handler} />);
            expect(root.innerHTML).toBe('<button id="btn"></button>');
            expect(handler).not.toHaveBeenCalled();
            root.getElementsByTagName("button")[0].click();
            expect(handler).toHaveBeenCalledOnce();
            expect(handler.mock.calls[0].length).toBe(1);
            expect(handler.mock.calls[0][0]).toBeInstanceOf(Event);
        });
        it("can be registered via Promise", async () => {
            const handler = vi.fn();
            const promise = new Promise(resolve => setTimeout(() => resolve(handler), 0));
            const root = render(<button id="btn" onclick={promise} />);
            expect(root.innerHTML).toBe('<button id="btn"></button>');
            expect(handler).not.toHaveBeenCalled();
            root.getElementsByTagName("button")[0].click();
            expect(handler).not.toHaveBeenCalled();
            await promise;
            root.getElementsByTagName("button")[0].click();
            expect(handler).toHaveBeenCalledOnce();
            expect(handler.mock.calls[0].length).toBe(1);
            expect(handler.mock.calls[0][0]).toBeInstanceOf(Event);
        });
        it("can be registered via Observable", () => {
            const handler = vi.fn();
            let next = (value: Function | null) => {};
            const observable = new Observable<Function | null>(observer => { next = v => observer.next(v); });
            const root = render(<button id="btn" onclick={observable} />);
            expect(root.innerHTML).toBe('<button id="btn"></button>');
            expect(handler).not.toHaveBeenCalled();
            root.getElementsByTagName("button")[0].click();
            expect(handler).not.toHaveBeenCalled();
            next(handler);
            root.getElementsByTagName("button")[0].click();
            expect(handler).toHaveBeenCalledOnce();
            expect(handler.mock.calls[0].length).toBe(1);
            expect(handler.mock.calls[0][0]).toBeInstanceOf(Event);
            handler.mockClear();
            next(null);
            root.getElementsByTagName("button")[0].click();
            expect(handler).not.toHaveBeenCalled();
        });
        it("can be registered via signal", () => {
            const handler = vi.fn();
            const sig = signal<Function | null>(null);
            const root = render(<button id="btn" onclick={sig} />);
            expect(root.innerHTML).toBe('<button id="btn"></button>');
            expect(handler).not.toHaveBeenCalled();
            root.getElementsByTagName("button")[0].click();
            expect(handler).not.toHaveBeenCalled();
            sig.set(handler);
            root.getElementsByTagName("button")[0].click();
            expect(handler).toHaveBeenCalledOnce();
            expect(handler.mock.calls[0].length).toBe(1);
            expect(handler.mock.calls[0][0]).toBeInstanceOf(Event);
            handler.mockClear();
            sig.set(null);
            root.getElementsByTagName("button")[0].click();
            expect(handler).not.toHaveBeenCalled();
        });
    });
});
