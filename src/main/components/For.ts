/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { dispose } from "@kayahr/scope";
import { createEffect, createSignal } from "@kayahr/signal";
import { collectError, throwErrors } from "../errors.ts";
import type { JSX } from "../jsx.ts";
import { getParentChildNamespace, materialize, withNamespace } from "../runtime.ts";
import { Group } from "../rendered/Group.ts";
import { ScopedRendered } from "../rendered/ScopedRendered.ts";
import type { RenderedBase } from "../rendered/RenderedBase.ts";

/** Key strategy accepted by {@link For}. */
export type ForKey<T> = "index" | ((item: T) => unknown);

/**
 * Props accepted by {@link For}.
 */
export interface ForProps<T> {
    /** Static or reactive source array. */
    of: readonly T[] | null | undefined | (() => readonly T[] | null | undefined);

    /** Optional list identity strategy. Defaults to item/reference identity. */
    key?: ForKey<T>;

    /** Row renderer receiving reactive accessors for item and index. */
    children: (item: () => T, index: () => number) => JSX.Element;
}

/** Internal For row state. */
interface ForEntry<T> {
    /** Stable key used for keyed reconciliation. */
    readonly key: unknown;

    /** Rendered row view. */
    readonly rendered: RenderedBase;

    /**
     * Updates the row item and index signals.
     *
     * @param item  - The next item value.
     * @param index - The next row index.
     */
    update(item: T, index: number): void;
}

/**
 * Creates one For row entry with its own reactive scope.
 *
 * @param item     - The initial row item.
 * @param index    - The initial row index.
 * @param key      - The stable row key.
 * @param namespace - The namespace used to materialize the row content.
 * @param children - The row renderer.
 * @returns The created row entry.
 */
function createForEntry<T>(
    item: T,
    index: number,
    key: unknown,
    namespace: string | null,
    children: (item: () => T, index: () => number) => JSX.Element
): ForEntry<T> {
    const [ getItem, setItem ] = createSignal(item);
    const [ getIndex, setIndex ] = createSignal(index);
    const rendered = new ScopedRendered(() => withNamespace(namespace, () => materialize(children(getItem, getIndex))));

    return {
        key,
        rendered,
        /**
         * Updates the row item and index signals.
         *
         * @param nextItem  - The next item value.
         * @param nextIndex - The next row index.
         */
        update(nextItem, nextIndex) {
            setItem(nextItem);
            setIndex(nextIndex);
        }
    };
}

/**
 * Returns whether a view already occupies the desired slot before the given sibling.
 *
 * @param view   - The view to inspect.
 * @param parent - The expected parent node.
 * @param before - The sibling the view should end right before.
 * @returns True when the view is already in the correct DOM position.
 */
function isRenderedBefore(rendered: RenderedBase, parent: Node & ParentNode, before: ChildNode): boolean {
    const lastNode = rendered.getLastNode();
    return lastNode?.parentNode === parent && lastNode.nextSibling === before;
}

/**
 * Builds keyed entry buckets so duplicates can still be reused deterministically.
 *
 * @param entries - The current entries.
 * @returns Buckets keyed by entry identity.
 */
function createForBuckets<T>(entries: ReadonlyArray<ForEntry<T>>): Map<unknown, Array<ForEntry<T>>> {
    const buckets = new Map<unknown, Array<ForEntry<T>>>();
    for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        let bucket = buckets.get(entry.key);
        if (bucket == null) {
            bucket = [];
            buckets.set(entry.key, bucket);
        }
        bucket.push(entry);
    }
    return buckets;
}

/**
 * Pops one entry from the keyed buckets.
 *
 * @param buckets - The entry buckets.
 * @param key     - The key to pop.
 * @returns The reused entry or null.
 */
function popForBucketEntry<T>(buckets: Map<unknown, Array<ForEntry<T>>>, key: unknown): ForEntry<T> | null {
    const bucket = buckets.get(key);
    if (bucket == null) {
        return null;
    }
    const entry = bucket.pop()!;
    if (bucket.length === 0) {
        buckets.delete(key);
    }
    return entry;
}

/** Self-managed range view implementing {@link For}. */
class ForRendered<T> extends Group {
    readonly #getItems: () => readonly T[] | null | undefined;
    readonly #key: ForKey<T> | undefined;
    #namespace: string | null = null;
    readonly #children: (item: () => T, index: () => number) => JSX.Element;
    #entries: Array<ForEntry<T>> = [];
    #effect: ReturnType<typeof createEffect> | null = null;

    /**
     * Creates a lazy list view which starts materializing rows on first insertion.
     *
     * @param props - The component props.
     */
    public constructor({ of, key, children }: ForProps<T>) {
        super();
        this.#getItems = typeof of === "function" ? of : () => of;
        this.#key = key;
        this.#children = children;
    }

    /** @inheritdoc */
    protected override onInsert(parent: Node & ParentNode, before: ChildNode | null): void {
        this.#initialize(parent);
        super.onInsert(parent, before);
    }

    /** @inheritdoc */
    protected override onDispose(): void {
        const errors: unknown[] = [];
        this.#disposeEffect(errors);
        collectError(errors, () => super.onDispose());
        throwErrors(errors);
    }

    /** @inheritdoc */
    protected override onDestroy(): void {
        const errors: unknown[] = [];
        this.#disposeEffect(errors);
        collectError(errors, () => super.onDestroy());
        throwErrors(errors);
    }

    /**
     * Initializes the namespace and reconciliation effect on first insertion.
     *
     * @param parent - The first DOM parent receiving this list.
     */
    #initialize(parent: Node & ParentNode): void {
        const nextNamespace = getParentChildNamespace(parent);

        if (this.#namespace !== nextNamespace && this.#entries.length > 0) {
            const errors: unknown[] = [];
            this.#disposeEffect(errors);
            collectError(errors, () => super.clear());
            this.#entries = [];
            throwErrors(errors);
        }

        if (this.#effect != null) {
            return;
        }

        this.#namespace = nextNamespace;
        this.#effect = createEffect(() => {
            const nextItems = this.#getItems() ?? [];
            const currentParent = this.isInserted()
                ? this.getLastNode()?.parentNode as (Node & ParentNode) | null
                : null;

            if (this.#key === "index") {
                const previousEntries = this.#entries;
                const sharedCount = Math.min(previousEntries.length, nextItems.length);
                const nextEntries: Array<ForEntry<T>> = [];

                for (let i = 0; i < sharedCount; i++) {
                    const entry = previousEntries[i];
                    entry.update(nextItems[i], i);
                    nextEntries.push(entry);
                }
                for (let i = sharedCount; i < nextItems.length; i++) {
                    nextEntries.push(createForEntry(nextItems[i], i, i, this.#namespace, this.#children));
                }

                this.#entries = nextEntries;

                for (let i = sharedCount; i < nextEntries.length; i++) {
                    this.appendChild(nextEntries[i].rendered);
                }

                for (const entry of previousEntries.slice(nextItems.length)) {
                    super.removeChild(entry.rendered);
                }
                return;
            }

            const previousBuckets = createForBuckets(this.#entries);
            const nextEntries: Array<ForEntry<T>> = [];

            for (let i = 0; i < nextItems.length; i++) {
                const item = nextItems[i];
                const entryKey = typeof this.#key === "function" ? this.#key(item) : item;
                const reusedEntry = popForBucketEntry(previousBuckets, entryKey);
                if (reusedEntry == null) {
                    nextEntries.push(createForEntry(item, i, entryKey, this.#namespace, this.#children));
                } else {
                    reusedEntry.update(item, i);
                    nextEntries.push(reusedEntry);
                }
            }

            this.#entries = nextEntries;

            const staleEntries: Array<ForEntry<T>> = [];
            for (const bucket of previousBuckets.values()) {
                staleEntries.push(...bucket);
            }
            for (const entry of staleEntries) {
                super.removeChild(entry.rendered);
            }

            if (currentParent == null) {
                for (const entry of nextEntries) {
                    this.appendChild(entry.rendered);
                }
                return;
            }

            let beforeRendered: RenderedBase | null = null;
            for (let i = nextEntries.length - 1; i >= 0; i--) {
                const entry = nextEntries[i];
                const beforeNode = beforeRendered?.getFirstNode() ?? this.getLastNode();
                if (beforeNode != null && !isRenderedBefore(entry.rendered, currentParent, beforeNode)) {
                    this.insertChildBefore(entry.rendered, beforeRendered);
                }
                beforeRendered = entry.rendered;
            }
        });
    }

    /**
     * Disposes the active reconciliation effect, if any.
     */
    #disposeEffect(errors: unknown[]): void {
        if (this.#effect == null) {
            return;
        }
        const effect = this.#effect;
        this.#effect = null;
        collectError(errors, () => dispose(effect));
    }
}

/**
 * Iterates over an array with fine-grained row reuse and disposal.
 *
 * @param props - The component props.
 * @returns The rendered list content.
 */
export function For<T>(props: ForProps<T>): JSX.Element {
    return new ForRendered(props);
}
