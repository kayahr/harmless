/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { type CallableSignal, computed, signal, type WritableSignal } from "@kayahr/signal";

import type { Element } from "../utils/types.js";

/**
 * Properties for {@link For} component.
 */
export interface ForProperties<T = unknown> {
    /** The values to iterate over. Either a fixed array or a function returning an array (with dependency tracking) or a signal containing an array. */
    each: T[] | (() => T[]);

    /** The children to render for each iterated value. */
    children: (item: T, index: CallableSignal<number>) => Element;
}

class CacheStack<K, V> {
    readonly #cache = new Map<K, V[]>();

    public push(key: K, value: V): this {
        let stack = this.#cache.get(key);
        if (stack == null) {
            stack = [];
            this.#cache.set(key, stack);
        }
        stack.unshift(value);
        return this;
    }

    public pop(key: K): V | null {
        return this.#cache.get(key)?.pop() ?? null;
    }
}

/**
 * Iterates over an array and calls the render function given as component child for each array element. When array is a signal then changes are automatically
 * tracked to do fine-grained updates to the rendering. The render function is called again for new items and renderings for old items are automatically
 * removed. The index passed to the render function is a signal which reactively reports a new index if it changes.
 *
 * @param properties - The component properties.
 */
export function For<T>({ each, children }: ForProperties<T>): Element {
    let cache = new CacheStack<unknown, { element: Element, indexSignal: WritableSignal<number> }>();
    let oldCache: typeof cache | null = cache;
    const getItems = each instanceof Array ? () => each : each;
    const items = computed(() => {
        return getItems().map((item, index, items) => {
            if (index === 0) {
                // Swap cache on first element for automatic cleanup
                oldCache = cache;
                cache = new CacheStack<unknown, { element: Element, indexSignal: WritableSignal<number> }>();
            }
            const entry = oldCache?.pop(item);
            let element: Element;
            if (entry == null) {
                const indexSignal = signal(index);
                element = children(item, indexSignal);
                cache.push(item, { element, indexSignal });
            } else {
                element = entry.element;
                entry.indexSignal.set(index);
                cache.push(item, entry);
            }
            if (index === items.length - 1) {
                // Remove old cache when last item is reached for automatic cleanup
                oldCache = null;
            }
            return element;
        });
    });
    return <>{items}</>;
}
