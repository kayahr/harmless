/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Observable } from "@kayahr/observable";
import { signal } from "@kayahr/signal";
import { describe, it } from "node:test";

import { render } from "./render.ts";
import { assertInstanceOf, assertSame } from "@kayahr/assert";

describe("fixture", () => {
    describe("event", () => {
        it("can be registered statically", (context) => {
            const handler = context.mock.fn();
            const root = render(<button id="btn" onclick={handler} />);
            assertSame(root.innerHTML, '<button id="btn"></button>');
            assertSame(handler.mock.callCount(), 0);
            root.getElementsByTagName("button")[0].click();
            assertSame(handler.mock.callCount(), 1);
            assertSame(handler.mock.calls[0].arguments.length, 1);
            assertInstanceOf(handler.mock.calls[0].arguments[0], Event);
        });
        it("can be registered via Promise", async (context) => {
            const handler = context.mock.fn();
            const promise = new Promise(resolve => setTimeout(() => resolve(handler), 0));
            const root = render(<button id="btn" onclick={promise} />);
            assertSame(root.innerHTML, '<button id="btn"></button>');
            assertSame(handler.mock.callCount(), 0);
            root.getElementsByTagName("button")[0].click();
            assertSame(handler.mock.callCount(), 0);
            await promise;
            root.getElementsByTagName("button")[0].click();
            assertSame(handler.mock.callCount(), 1);
            assertSame(handler.mock.calls[0].arguments.length, 1);
            assertInstanceOf(handler.mock.calls[0].arguments[0], Event);
        });
        it("can be registered via Observable", (context) => {
            const handler = context.mock.fn();
            let next = (value: Function | null) => {};
            const observable = new Observable<Function | null>(observer => { next = v => observer.next(v); });
            const root = render(<button id="btn" onclick={observable} />);
            assertSame(root.innerHTML, '<button id="btn"></button>');
            assertSame(handler.mock.callCount(), 0);
            root.getElementsByTagName("button")[0].click();
            assertSame(handler.mock.callCount(), 0);
            next(handler);
            root.getElementsByTagName("button")[0].click();
            assertSame(handler.mock.callCount(), 1);
            assertSame(handler.mock.calls[0].arguments.length, 1);
            assertInstanceOf(handler.mock.calls[0].arguments[0], Event);
            handler.mock.resetCalls();
            next(null);
            root.getElementsByTagName("button")[0].click();
            assertSame(handler.mock.callCount(), 0);
        });
        it("can be registered via signal", (context) => {
            const handler = context.mock.fn();
            const sig = signal<Function | null>(null);
            const root = render(<button id="btn" onclick={sig} />);
            assertSame(root.innerHTML, '<button id="btn"></button>');
            assertSame(handler.mock.callCount(), 0);
            root.getElementsByTagName("button")[0].click();
            assertSame(handler.mock.callCount(), 0);
            sig.set(handler);
            root.getElementsByTagName("button")[0].click();
            assertSame(handler.mock.callCount(), 1);
            assertSame(handler.mock.calls[0].arguments.length, 1);
            assertInstanceOf(handler.mock.calls[0].arguments[0], Event);
            handler.mock.resetCalls();
            sig.set(null);
            root.getElementsByTagName("button")[0].click();
            assertSame(handler.mock.callCount(), 0);
        });
    });
});
