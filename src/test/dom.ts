/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register({ url: "http://localhost/" });

// Workaround for https://github.com/capricorn86/happy-dom/issues/1846
const origHref = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(globalThis.location), "href");
Object.defineProperty(globalThis.location, "href", {
    get() {
        return origHref!.get!.call(this);
    },
    set(value: string) {
        if (value !== origHref!.get!.call(this)) {
            origHref!.set!.call(this, value);
            globalThis.dispatchEvent(new globalThis.PopStateEvent("popstate"));
        }
    }
});
const origHash = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(globalThis.location), "hash");
Object.defineProperty(globalThis.location, "hash", {
    get() {
        return origHash!.get!.call(this);
    },
    set(value: string) {
        if (value !== origHash!.get!.call(this)) {
            origHash!.set!.call(this, value);
            globalThis.dispatchEvent(new globalThis.PopStateEvent("popstate"));
        }
    }
});
