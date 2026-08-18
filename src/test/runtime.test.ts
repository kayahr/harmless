/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import "./dom.ts";
import { describe, it } from "node:test";
import { assertInstanceOf, assertSame } from "@kayahr/assert";
import { AsyncRendered } from "../main/rendered/AsyncRendered.ts";
import { NodeRendered } from "../main/rendered/NodeRendered.ts";
import { materialize } from "../main/runtime.ts";

describe("internal runtime", () => {
    it("materializes empty arrays as empty range views", () => {
        const view = materialize([]);
        const host = document.createElement("div");

        assertInstanceOf(view.getFirstNode(), Comment);
        assertInstanceOf(view.getLastNode(), Comment);
        assertSame(view.getSingleNode(), null);

        view.insert(host, null);
        assertSame(host.textContent, "");

        view.destroy();
        assertSame(host.textContent, "");
    });

    it("materializes single-entry arrays as anchored range views", () => {
        const view = materialize([ "A" ]);
        const host = document.createElement("div");

        assertInstanceOf(view.getFirstNode(), Comment);
        assertInstanceOf(view.getLastNode(), Comment);
        assertSame(view.getSingleNode(), null);

        view.insert(host, null);
        assertSame(host.textContent, "A");

        view.destroy();
        assertSame(host.textContent, "");
    });

    it("materializes dynamic getters as anchored views", () => {
        const view = materialize(() => "A");
        const host = document.createElement("div");

        assertSame(view.getSingleNode(), null);
        assertInstanceOf(view.getFirstNode(), Comment);
        assertInstanceOf(view.getLastNode(), Comment);

        view.insert(host, null);
        assertSame(host.textContent, "A");

        view.destroy();
        assertSame(host.textContent, "");
    });

    it("disposes async resolves after disposal without inserting them", async () => {
        let resolve!: (view: NodeRendered<Text>) => void;
        let disposed = 0;
        const view = new AsyncRendered(new Promise<NodeRendered<Text>>(callback => {
            resolve = callback;
        }));
        const host = document.createElement("div");

        assertSame(view.getSingleNode(), null);
        assertInstanceOf(view.getFirstNode(), Comment);
        assertInstanceOf(view.getLastNode(), Comment);

        view.insert(host, null);
        view.dispose();
        resolve(new NodeRendered(document.createTextNode("A"), () => {
            disposed++;
        }));
        await Promise.resolve();

        assertSame(host.textContent, "");
        assertSame(disposed, 1);
    });

    it("ignores async rejects after destroy", async () => {
        let reject!: (error: unknown) => void;
        const view = new AsyncRendered(new Promise<never>((_resolve, callback) => {
            reject = callback;
        }));
        const host = document.createElement("div");

        view.insert(host, null);
        view.destroy();
        reject(new Error("ignored"));
        await Promise.resolve();

        assertSame(host.textContent, "");
    });

    it("queues async rejects for later throwing while still active", async () => {
        const expected = new Error("boom");
        const host = document.createElement("div");
        const originalQueueMicrotask = globalThis.queueMicrotask;
        let queuedCallback: (() => void) | null = null;
        globalThis.queueMicrotask = callback => {
            queuedCallback = callback;
        };
        try {
            new AsyncRendered(Promise.reject(expected)).insert(host, null);
            await Promise.resolve();

            assertSame(typeof queuedCallback, "function");
            try {
                queuedCallback!();
            } catch (error) {
                assertSame(error, expected);
            }
            assertSame(host.textContent, "");
        } finally {
            globalThis.queueMicrotask = originalQueueMicrotask;
        }
    });
});
